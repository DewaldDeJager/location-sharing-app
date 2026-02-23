import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const ParamsSchema = z.object({
  groupId: z.string().uuid({ message: "groupId must be a valid UUID" }),
  memberId: z.string().uuid({ message: "memberId must be a valid UUID" }),
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

  const parsedParams = ParamsSchema.safeParse({
    groupId: event.pathParameters?.groupId,
    memberId: event.pathParameters?.memberId,
  });
  if (!parsedParams.success) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid path parameters", issues: parsedParams.error.format() }),
    };
  }

  const { groupId, memberId } = parsedParams.data;
  const tableName = process.env.SOCIAL_GRAPH_TABLE_NAME || "SocialGraph";

  // TODO: Add validation so that you can only add a member to group if you follow them

  try {
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: tableName,
              Item: {
                userId: sub,
                sortKey: `MEMBER#${memberId}#GROUP#${groupId}`,
              },
            },
          },
          {
            Put: {
              TableName: tableName,
              Item: {
                userId: sub,
                sortKey: `GROUP#${groupId}#MEMBER#${memberId}`,
              },
            },
          },
        ],
      })
    );
  } catch (err: any) {
    console.error("DynamoDB transact write error", err);
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
