import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { z } from "zod";
import { removeGroup } from "../../services/group-service";
import { NotFoundError } from "../../domain/types";

const ParamsSchema = z.object({
  id: z.string().uuid({ message: "id must be a valid UUID" }),
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

  const parsed = ParamsSchema.safeParse({ id: event.pathParameters?.id });
  if (!parsed.success) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid path parameters", issues: parsed.error.format() }),
    };
  }

  try {
    await removeGroup(sub, parsed.data.id);
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
    console.error("Remove group error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
