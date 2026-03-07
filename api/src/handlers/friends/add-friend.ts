import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { z } from "zod";
import { addFriend } from "../../services/friend-service";

const BodySchema = z.object({
  id: z.string().uuid({ message: "id must be a valid UUID" }),
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

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid request body", issues: parsed.error.format() }),
    };
  }

  const { id, name } = parsed.data;

  try {
    await addFriend(sub, id, name);
    return {
      statusCode: 204,
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    console.error("DynamoDB put error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
