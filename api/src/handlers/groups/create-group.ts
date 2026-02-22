import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const CreateGroupSchema = z.object({
  name: z.string().min(1, { message: "name is required" }).max(200, { message: "name too long" }),
});

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

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid request: missing body" }),
    };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid JSON body" }),
    };
  }

  const parsed = CreateGroupSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid payload", issues: parsed.error.format() }),
    };
  }

  const id = randomUUID();
  const name = parsed.data.name;
  const tableName = process.env.SOCIAL_GRAPH_TABLE_NAME || "SocialGraph";

  try {
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          userId: sub,
          sortKey: `GROUP#${id}`,
          name,
        },
        ConditionExpression: "attribute_not_exists(userId) AND attribute_not_exists(sortKey)",
      })
    );
  } catch (err) {
    console.error("DynamoDB put error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }

  return {
    statusCode: 201,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, name }),
  };
};
