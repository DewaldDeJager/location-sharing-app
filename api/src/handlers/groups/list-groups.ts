import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, NativeAttributeValue } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

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

  const tableName = process.env.SOCIAL_GRAPH_TABLE_NAME || "SocialGraph";

  try {
    const res = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "#pk = :uid AND begins_with(#sk, :prefix)",
        ExpressionAttributeNames: {
          "#pk": "userId",
          "#sk": "sortKey",
        },
        ExpressionAttributeValues: {
          ":uid": sub,
          ":prefix": "GROUP#",
        },
      })
    );

    const groups = (res.Items || []).map((item: Record<string, NativeAttributeValue>) => {
      const sortKey: string = item.sortKey as string;
      const id = sortKey.startsWith("GROUP#") ? sortKey.substring(6) : sortKey;
      return { id, name: item.name };
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(groups),
    };
  } catch (err) {
    console.error("DynamoDB query error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
