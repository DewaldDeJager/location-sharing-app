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
import { Friend, NotFoundError } from "../domain/types";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const TRANSACTION_BATCH_SIZE = 100;

function getTableName(): string {
  return process.env.SOCIAL_GRAPH_TABLE_NAME || "SocialGraph";
}

export async function addFriend(userId: string, id: string, name?: string): Promise<void> {
  const tableName = getTableName();

  const item: Record<string, unknown> = {
    userId,
    sortKey: `FOLLOW#${id}`,
  };
  if (name !== undefined) {
    item.name = name;
  }

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );
}

export async function getFriend(userId: string, id: string): Promise<Friend> {
  const tableName = getTableName();

  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        userId,
        sortKey: `FOLLOW#${id}`,
      },
    })
  );

  if (!result.Item) {
    throw new NotFoundError("Friend not found");
  }

  return {
    id,
    name: result.Item.name ?? null,
  };
}

export async function listFriends(
  userId: string
): Promise<Array<{ id: string; name?: string }>> {
  const tableName = getTableName();

  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "userId = :userId AND begins_with(sortKey, :prefix)",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":prefix": "FOLLOW#",
      },
    })
  );

  return (result.Items ?? []).map((item) => ({
    id: item.sortKey.replace("FOLLOW#", ""),
    name: item.name,
  }));
}

export async function updateFriend(
  userId: string,
  id: string,
  name?: string
): Promise<void> {
  const tableName = getTableName();

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          userId,
          sortKey: `FOLLOW#${id}`,
        },
        ConditionExpression: "attribute_exists(userId) AND attribute_exists(sortKey)",
        UpdateExpression: "SET #name = :name",
        ExpressionAttributeNames: { "#name": "name" },
        ExpressionAttributeValues: { ":name": name ?? null },
      })
    );
  } catch (err) {
    if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
      throw new NotFoundError("Friend not found");
    }
    throw err;
  }
}

export async function removeFriend(userId: string, id: string): Promise<void> {
  const tableName = getTableName();

  // Query all group membership items where userId = sub and sortKey begins with `MEMBER#${id}#GROUP#`
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
          ":prefix": `MEMBER#${id}#GROUP#`,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    for (const item of queryResult.Items ?? []) {
      const groupId = (item.sortKey as string).replace(`MEMBER#${id}#GROUP#`, "");
      // Collect both directions of the membership record
      membershipItems.push({ userId, sortKey: `MEMBER#${id}#GROUP#${groupId}` });
      membershipItems.push({ userId, sortKey: `GROUP#${groupId}#MEMBER#${id}` });
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
          sortKey: `FOLLOW#${id}`,
        },
        ConditionExpression: "attribute_exists(userId) AND attribute_exists(sortKey)",
        ReturnValues: "NONE",
      })
    );
  } catch (err) {
    if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
      throw new NotFoundError("Friend not found");
    }
    throw err;
  }
}
