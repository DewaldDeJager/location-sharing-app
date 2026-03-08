import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
  QueryCommand,
  QueryCommandOutput,
  TransactWriteCommand,
  NativeAttributeValue,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { Group, NotFoundError, ForbiddenError } from "../domain/types";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const TRANSACTION_BATCH_SIZE = 100;

function getTableName(): string {
  return process.env.SOCIAL_GRAPH_TABLE_NAME || "SocialGraph";
}

export async function createGroup(
  userId: string,
  name: string,
  members?: string[]
): Promise<Group> {
  const id = randomUUID();
  const tableName = getTableName();

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        userId,
        sortKey: `GROUP#${id}`,
        name,
      },
      ConditionExpression: "attribute_not_exists(userId) AND attribute_not_exists(sortKey)",
    })
  );

  if (members) {
    for (const memberId of members) {
      try {
        await addGroupMember(userId, id, memberId);
      } catch (e: unknown) {
        if (!(e instanceof ForbiddenError)) throw e;
      }
    }
  }

  return { id, name };
}

export async function getGroup(userId: string, id: string): Promise<Group> {
  const tableName = getTableName();

  const res = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        userId,
        sortKey: `GROUP#${id}`,
      },
    })
  );

  if (!res.Item) {
    throw new NotFoundError("Group not found");
  }

  const name = (res.Item as Record<string, NativeAttributeValue>).name;
  return { id, name: name as string };
}

export async function listGroups(
  userId: string,
  includeMembers: boolean = false
): Promise<Group[]> {
  const tableName = getTableName();

  const res = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "#pk = :uid AND begins_with(#sk, :prefix)",
      ExpressionAttributeNames: {
        "#pk": "userId",
        "#sk": "sortKey",
      },
      ExpressionAttributeValues: {
        ":uid": userId,
        ":prefix": "GROUP#",
      },
    })
  );

  const groupMembers = new Map<string, Array<string>>();
  if (includeMembers) {
    (res.Items || [])
      .filter((item) => item.sortKey.includes("#MEMBER#"))
      .forEach((item: Record<string, NativeAttributeValue>) => {
        const sortKey: string = item.sortKey as string;
        // Example of sortKey: GROUP#12e49d15-320e-4962-8d31-be3aff951e1c#MEMBER#6406ec2b-31db-48ed-aafc-0881530a6f20
        const output = sortKey.split("#");
        const groupId = output[1];
        const memberId = output[3];

        if (groupMembers.has(groupId)) {
          groupMembers.get(groupId)?.push(memberId);
        } else {
          groupMembers.set(groupId, [memberId]);
        }
      });
  }

  const groups = (res.Items || [])
    .filter((item) => !item.sortKey.includes("#MEMBER#"))
    .map((item: Record<string, NativeAttributeValue>) => {
      const sortKey: string = item.sortKey as string;
      const id = sortKey.startsWith("GROUP#") ? sortKey.substring(6) : sortKey;
      const members = includeMembers ? groupMembers.get(id) : undefined;
      return { id, name: item.name as string, members: members };
    });

  return groups;
}

export async function updateGroup(
  userId: string,
  id: string,
  name?: string,
  members?: string[]
): Promise<Group> {
  const tableName = getTableName();

  if (name) {
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: {
            userId,
            sortKey: `GROUP#${id}`,
          },
          UpdateExpression: "SET #name = :name",
          ExpressionAttributeNames: {
            "#name": "name",
          },
          ExpressionAttributeValues: {
            ":name": name,
          },
          ConditionExpression: "attribute_exists(userId) AND attribute_exists(sortKey)",
          ReturnValues: "NONE",
        })
      );
    } catch (err) {
      if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
        throw new NotFoundError("Group not found");
      }
      throw err;
    }
  }

  if (members) {
    // Retrieve current members
    const currentMembers: string[] = [];
    let lastEvaluatedKey: Record<string, NativeAttributeValue> | undefined = undefined;
    const prefix = `GROUP#${id}#MEMBER#`;

    do {
      const result: QueryCommandOutput = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "userId = :userId AND begins_with(sortKey, :prefix)",
          ExpressionAttributeValues: {
            ":userId": userId,
            ":prefix": prefix,
          },
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );

      for (const item of result.Items ?? []) {
        currentMembers.push((item.sortKey as string).replace(prefix, ""));
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    const desiredSet = new Set(members);
    const currentSet = new Set(currentMembers);

    // Add new members
    for (const memberId of desiredSet) {
      if (!currentSet.has(memberId)) {
        try {
          await addGroupMember(userId, id, memberId);
        } catch (e: unknown) {
          if (!(e instanceof ForbiddenError)) throw e;
        }
      }
    }

    // Remove members no longer in the list
    for (const memberId of currentSet) {
      if (!desiredSet.has(memberId)) {
        await removeGroupMember(userId, id, memberId);
      }
    }
  }

  return { id, name };
}

export async function removeGroup(userId: string, id: string): Promise<void> {
  const tableName = getTableName();

  // Query all group membership items: sortKey begins with `GROUP#${id}#MEMBER#`
  const membershipItems: { userId: string; sortKey: string }[] = [];
  let lastEvaluatedKey: Record<string, NativeAttributeValue> | undefined = undefined;

  let queryResult: QueryCommandOutput;
  do {
    queryResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "userId = :userId AND begins_with(sortKey, :prefix)",
        ExpressionAttributeValues: {
          ":userId": userId,
          ":prefix": `GROUP#${id}#MEMBER#`,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    for (const item of queryResult.Items ?? []) {
      const memberId = (item.sortKey as string).replace(`GROUP#${id}#MEMBER#`, "");
      // Collect both directions of the membership record
      membershipItems.push({ userId, sortKey: `GROUP#${id}#MEMBER#${memberId}` });
      membershipItems.push({ userId, sortKey: `MEMBER#${memberId}#GROUP#${id}` });
    }

    lastEvaluatedKey = queryResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  // Delete membership items in batches (max TRANSACTION_BATCH_SIZE per transaction)
  for (let i = 0; i < membershipItems.length; i += TRANSACTION_BATCH_SIZE) {
    const batch = membershipItems.slice(i, i + TRANSACTION_BATCH_SIZE);
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: batch.map((item) => ({
          Delete: {
            TableName: tableName,
            Key: { userId: item.userId, sortKey: item.sortKey },
          },
        })),
      })
    );
  }

  try {
    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: {
          userId,
          sortKey: `GROUP#${id}`,
        },
        ConditionExpression: "attribute_exists(userId) AND attribute_exists(sortKey)",
        ReturnValues: "NONE",
      })
    );
  } catch (err) {
    if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
      throw new NotFoundError("Group not found");
    }
    throw err;
  }
}

export async function addGroupMember(
  userId: string,
  groupId: string,
  memberId: string
): Promise<void> {
  const tableName = getTableName();

  const [followResult, groupResult] = await Promise.all([
    docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { userId, sortKey: `FOLLOW#${memberId}` },
      })
    ),
    docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { userId, sortKey: `GROUP#${groupId}` },
      })
    ),
  ]);

  if (!followResult.Item) {
    throw new ForbiddenError("You must be following the member to add them to a group");
  }

  if (!groupResult.Item) {
    throw new NotFoundError("Group does not exist");
  }

  await docClient.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: tableName,
            Item: {
              userId,
              sortKey: `MEMBER#${memberId}#GROUP#${groupId}`,
            },
          },
        },
        {
          Put: {
            TableName: tableName,
            Item: {
              userId,
              sortKey: `GROUP#${groupId}#MEMBER#${memberId}`,
            },
          },
        },
      ],
    })
  );
}

export async function removeGroupMember(
  userId: string,
  groupId: string,
  memberId: string
): Promise<void> {
  const tableName = getTableName();

  try {
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName: tableName,
              Key: {
                userId,
                sortKey: `MEMBER#${memberId}#GROUP#${groupId}`,
              },
              ConditionExpression: "attribute_exists(userId) AND attribute_exists(sortKey)",
            },
          },
          {
            Delete: {
              TableName: tableName,
              Key: {
                userId,
                sortKey: `GROUP#${groupId}#MEMBER#${memberId}`,
              },
              ConditionExpression: "attribute_exists(userId) AND attribute_exists(sortKey)",
            },
          },
        ],
      })
    );
  } catch (err) {
    if (err instanceof Error && err.name === "TransactionCanceledException") {
      throw new NotFoundError("Group member not found");
    }
    throw err;
  }
}
