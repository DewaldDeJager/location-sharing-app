import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, QueryCommand, QueryCommandOutput, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const ParamsSchema = z.object({
  id: z.string().uuid({ message: "id must be a valid UUID" }),
});

// DynamoDB TransactWriteItems supports a maximum of 100 items per transaction
const TRANSACTION_BATCH_SIZE = 100;

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  const claims = event.requestContext.authorizer.jwt.claims;
  const sub = claims.sub as string | undefined;
  if (!sub) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Unauthorized: missing sub claim" }),
    };
  }

  const parsed = ParamsSchema.safeParse({ id: event.pathParameters?.id });
  if (!parsed.success) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid path parameters", issues: parsed.error.format() }),
    };
  }

  const { id } = parsed.data;
  const tableName = process.env.SOCIAL_GRAPH_TABLE_NAME || "SocialGraph";

  // Query all group membership items where userId = sub and sortKey begins with `MEMBER#${id}#GROUP#`
  const membershipItems: { userId: string; sortKey: string }[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined = undefined;

  let queryResult: QueryCommandOutput;
  do {
    queryResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "userId = :userId AND begins_with(sortKey, :prefix)",
        ExpressionAttributeValues: {
          ":userId": sub,
          ":prefix": `MEMBER#${id}#GROUP#`,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    for (const item of queryResult.Items ?? []) {
      const groupId = (item.sortKey as string).replace(`MEMBER#${id}#GROUP#`, "");
      // Collect both directions of the membership record
      membershipItems.push({ userId: sub, sortKey: `MEMBER#${id}#GROUP#${groupId}` });
      membershipItems.push({ userId: sub, sortKey: `GROUP#${groupId}#MEMBER#${id}` });
    }

    lastEvaluatedKey = queryResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  // Delete membership items in batches (max TRANSACTION_BATCH_SIZE per transaction)
  for (let i = 0; i < membershipItems.length; i += TRANSACTION_BATCH_SIZE) {
    const batch = membershipItems.slice(i, i + TRANSACTION_BATCH_SIZE);
    try {
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
    } catch (err: any) {
      console.error("DynamoDB transact write error while deleting membership items", err);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Internal Server Error" }),
      };
    }
  }

  try {
    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: {
          userId: sub,
          sortKey: `FOLLOW#${id}`,
        },
        ConditionExpression: "attribute_exists(userId) AND attribute_exists(sortKey)",
        ReturnValues: "NONE",
      })
    );
  } catch (err: any) {
    if (err && err.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Friend not found" }),
      };
    }
    console.error("DynamoDB delete error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }

  return {
    statusCode: 204,
    headers: { "Content-Type": "application/json" },
  };
};
