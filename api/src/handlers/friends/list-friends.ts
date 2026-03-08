import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { z } from "zod";
import { listFriends } from "../../services/friend-service";

const ListFriendsSchema = z.object({
  includeGroups: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? true : val !== "false"))
    .pipe(z.boolean()),
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

  const queryResult = ListFriendsSchema.safeParse(event.queryStringParameters ?? {});
  if (!queryResult.success) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Bad Request", errors: queryResult.error.errors }),
    };
  }

  const { includeGroups } = queryResult.data;

  try {
    const friends = await listFriends(sub, includeGroups);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(friends),
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
