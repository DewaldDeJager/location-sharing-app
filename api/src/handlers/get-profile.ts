import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import axios from "axios";

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

  const responseBody = {
    userId: item.userId,
    deviceId: item.deviceId,
    lastKnownLocation: {
      latitude: item.latitude,
      longitude: item.longitude,
      timestamp: item.timestampIso,
      formattedAddress,
      timeZoneId,
      timeZoneName,
    },
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(responseBody),
  };
};
