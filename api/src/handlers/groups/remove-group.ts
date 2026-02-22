import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const ParamsSchema = z.object({
  id: z.string().uuid({ message: "id must be a valid UUID" }),
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

  try {
    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: {
          userId: sub,
          sortKey: `GROUP#${id}`,
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
        body: JSON.stringify({ message: "Group not found" }),
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
    headers: { "Content-Type": "application/json" }
  };
};
