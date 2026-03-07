import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { getProfile } from "../services/location-service";
import { NotFoundError } from "../domain/types";

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

  try {
    const { profile, geocoding } = await getProfile(sub);

    const responseBody = {
      userId: profile.userId,
      deviceId: profile.deviceId,
      lastKnownLocation: {
        latitude: profile.latitude,
        longitude: profile.longitude,
        timestamp: profile.timestampIso,
        formattedAddress: geocoding.formattedAddress,
        timeZoneId: geocoding.timeZoneId,
        timeZoneName: geocoding.timeZoneName,
      },
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(responseBody),
    };
  } catch (err) {
    if (err instanceof NotFoundError) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: err.message }),
      };
    }
    console.error("Get profile error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
