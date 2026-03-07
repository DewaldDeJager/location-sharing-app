import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { z } from "zod";
import { updateFriend } from "../../services/friend-service";
import { NotFoundError } from "../../domain/types";

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

  try {
    await updateFriend(sub, parsedParams.data.id, parsedBody.data.name);
    return {
      statusCode: 204,
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    if (err instanceof NotFoundError) {
      return {
        statusCode: 404,
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
