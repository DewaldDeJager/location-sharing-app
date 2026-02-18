import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);


export type LocationEvent = {
  latitude: number;
  longitude: number;
  timestamp: string; // ISO-8601
  deviceId: string;
};

// Zod schema: validate and transform in one step
const LocationEventSchema = z
  .object({
    latitude: z.number().finite().min(-90, { message: "latitude >= -90" }).max(90, { message: "latitude <= 90" }),
    longitude: z
      .number()
      .finite()
      .min(-180, { message: "longitude >= -180" })
      .max(180, { message: "longitude <= 180" }),
    // Require ISO-8601 string per Zod's datetime validator
    timestamp: z.string().datetime({ message: "timestamp must be ISO-8601 date-time" }),
    deviceId: z.string().min(1, { message: "deviceId required" }),
  })
  .transform((v) => ({
    latitude: v.latitude,
    longitude: v.longitude,
    deviceId: v.deviceId,
    timestampIso: v.timestamp,
    timestampMs: Date.parse(v.timestamp),
  }));


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

  // Parse and validate request body (Zod)
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

  const parsed = LocationEventSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid payload", issues: parsed.error.format() }),
    };
  }

  const { latitude, longitude, deviceId, timestampMs, timestampIso } = parsed.data;
  if (Number.isNaN(timestampMs)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid timestamp: must be ISO-8601" }),
    };
  }

  const tableName = process.env.LOCATION_TABLE_NAME || "LocationData";

  // Write to DynamoDB only if the incoming timestamp is newer than what's stored
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { userId: sub }, // TODO: Add the device ID here once we have added it as the sort key
        UpdateExpression:
          "SET #lat = :lat, #lng = :lng, #ts = :ts, #deviceId = :deviceId, #tsIso = :tsIso",
        ExpressionAttributeNames: {
          "#lat": "latitude",
          "#lng": "longitude",
          "#ts": "timestamp",
          "#tsIso": "timestampIso",
          "#deviceId": "deviceId",
        },
        ExpressionAttributeValues: {
          ":lat": latitude,
          ":lng": longitude,
          ":ts": timestampMs,
          ":tsIso": timestampIso,
          ":deviceId": deviceId,
        },
        // Allow create when item doesn't exist OR update only if stored timestamp is older
        ConditionExpression:
          "attribute_not_exists(userId) OR attribute_not_exists(#ts) OR #ts < :ts",
        ReturnValues: "NONE",
      })
    );
  } catch (err: any) {
    if (err && err.name === "ConditionalCheckFailedException") {
      // Incoming timestamp is not newer than existing
      return {
        statusCode: 409,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Ignored older or same timestamp update" }),
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
    headers: { "Content-Type": "application/json" }
  };
};
