import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import axios from "axios";
import {
  LocationData,
  ProfileLocation,
  GeocodingInfo,
  NotFoundError,
  ConflictError,
} from "../domain/types";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const ssmClient = new SSMClient({ region: process.env.AWS_REGION });

interface GoogleConfig {
  apiKey: string;
  geocodingApiUrl: string;
  placesApiUrl: string;
  timezoneApiUrl: string;
}

let googleConfig: GoogleConfig | null = null;

async function getGoogleConfig(): Promise<GoogleConfig> {
  if (googleConfig) return googleConfig;

  const parameterName = process.env.GOOGLE_CONFIG_PARAMETER_NAME;
  if (!parameterName) {
    throw new Error("GOOGLE_CONFIG_PARAMETER_NAME environment variable is not set");
  }

  const response = await ssmClient.send(
    new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true,
    })
  );

  if (!response.Parameter?.Value) {
    throw new Error(`SSM parameter ${parameterName} not found or empty`);
  }

  googleConfig = JSON.parse(response.Parameter.Value);
  return googleConfig!;
}

interface GeocodingResponse {
  results: Array<{
    formattedAddress: string;
  }>;
}

interface TimezoneResponse {
  timeZoneId: string;
  timeZoneName: string;
  status: string;
}

export async function processLocation(userId: string, location: LocationData): Promise<void> {
  const tableName = process.env.LOCATION_TABLE_NAME || "LocationData";

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { userId }, // TODO: Add the device ID here once we have added it as the sort key
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
          ":lat": location.latitude,
          ":lng": location.longitude,
          ":ts": location.timestampMs,
          ":tsIso": location.timestampIso,
          ":deviceId": location.deviceId,
        },
        // Allow create when item doesn't exist OR update only if stored timestamp is older
        ConditionExpression:
          "attribute_not_exists(userId) OR attribute_not_exists(#ts) OR #ts < :ts",
        ReturnValues: "NONE",
      })
    );
  } catch (err) {
    if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
      throw new ConflictError("Ignored older or same timestamp update");
    }
    throw err;
  }
}

export async function getProfile(
  userId: string
): Promise<{ profile: ProfileLocation; geocoding: GeocodingInfo }> {
  const tableName = process.env.LOCATION_TABLE_NAME || "LocationData";

  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { userId }, // TODO: Add the device ID here once we have added it as the sort key
    })
  );

  const item = result.Item;

  if (!item) {
    throw new NotFoundError("Profile not found");
  }

  const profile: ProfileLocation = {
    userId: item.userId,
    deviceId: item.deviceId,
    latitude: item.latitude,
    longitude: item.longitude,
    timestampIso: item.timestampIso,
  };

  let formattedAddress: string | null = null;
  let timeZoneId: string | null = null;
  let timeZoneName: string | null = null;

  try {
    const config = await getGoogleConfig();
    const { latitude, longitude } = item;

    // Call Reverse Geocoding API
    const geocodingUrl = `${config.geocodingApiUrl}/location/${latitude},${longitude}`;
    const geocodingRes = await axios.get<GeocodingResponse>(geocodingUrl, {
      headers: {
        "X-Goog-Api-Key": config.apiKey,
      },
    });
    if (geocodingRes.data.results?.length > 0) {
      formattedAddress = geocodingRes.data.results[0].formattedAddress;
    }

    // Call Time Zone API
    const nowTimestamp = Math.floor(Date.now() / 1000);
    const timezoneUrl = `${config.timezoneApiUrl}?location=${latitude},${longitude}&timestamp=${nowTimestamp}&key=${config.apiKey}`;
    const timezoneRes = await axios.get<TimezoneResponse>(timezoneUrl);
    if (timezoneRes.data.status === "OK") {
      timeZoneId = timezoneRes.data.timeZoneId;
      timeZoneName = timezoneRes.data.timeZoneName;
    }
  } catch (err) {
    console.error("Error fetching location or timezone info:", err);
    // Continue with default values if API calls fail
  }

  return {
    profile,
    geocoding: { formattedAddress, timeZoneId, timeZoneName },
  };
}

export async function getUserLocation(userId: string): Promise<LocationData | null> {
  const tableName = process.env.LOCATION_TABLE_NAME || "LocationData";

  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { userId }, // TODO: Add the device ID here once we have added it as the sort key
    })
  );

  const item = result.Item;

  if (!item) {
    return null;
  }

  const userLocation: LocationData = {
    deviceId: item.deviceId,
    latitude: item.latitude,
    longitude: item.longitude,
    timestampMs: item.timestampMs,
    timestampIso: item.timestampIso,
  };

  return userLocation;
}
