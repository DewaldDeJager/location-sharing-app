import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const ParamsSchema = z.object({
  id: z.string().uuid({ message: "id must be a valid UUID" }),
});

const BodySchema = z.object({
  name: z.string().min(1, { message: "name must not be empty" }).optional(),
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

  const parsedParams = ParamsSchema.safeParse({ id: event.pathParameters?.id });
  if (!parsedParams.success) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Invalid path parameters",
        issues: parsedParams.error.format(),
      }),
    };
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid JSON body" }),
    };
  }

  const parsedBody = BodySchema.safeParse(body);
  if (!parsedBody.success) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid request body", issues: parsedBody.error.format() }),
    };
  }

  const { id } = parsedParams.data;
  const { name } = parsedBody.data;
  const tableName = process.env.SOCIAL_GRAPH_TABLE_NAME || "SocialGraph";

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          userId: sub,
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
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Friend not found" }),
      };
    }
    console.error("DynamoDB update error", err);
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
