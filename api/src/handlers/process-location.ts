import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { z } from "zod";
import { processLocation } from "../services/location-service";
import { ConflictError } from "../domain/types";

export type LocationEvent = {
  latitude: number;
  longitude: number;
  timestamp: string; // ISO-8601
  deviceId: string;
};

// Zod schema: validate and transform in one step
const LocationEventSchema = z
  .object({
    latitude: z
      .number()
      .finite()
      .min(-90, { message: "latitude >= -90" })
      .max(90, { message: "latitude <= 90" }),
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

  try {
    await processLocation(sub, { latitude, longitude, deviceId, timestampMs, timestampIso });
    return {
      statusCode: 204,
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    if (err instanceof ConflictError) {
      return {
        statusCode: 409,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: err.message }),
      };
    }
    console.error("DynamoDB update error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
