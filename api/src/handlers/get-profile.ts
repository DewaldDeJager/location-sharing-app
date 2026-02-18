import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

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

  const tableName = process.env.LOCATION_TABLE_NAME || "LocationData";

  let result;
  try {
    result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { userId: sub }, // TODO: Add the device ID here once we have added it as the sort key
      })
    );
  } catch (err: any) {
    console.error("DynamoDB get error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }

  const item = result.Item;

  if (!item) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Profile not found" }),
    };
  }

  const responseBody = {
    userId: item.userId,
    deviceId: item.deviceId,
    lastKnownLocation: {
      latitude: item.latitude,
      longitude: item.longitude,
      timestamp: item.timestampIso,
      formattedAddress: "123 Main St, Cape Town, South Africa", // Stubbed
      timeZoneId: "Africa/Johannesburg", // Stubbed
      timeZoneName: "South Africa Standard Time", // Stubbed
    },
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(responseBody),
  };
};
