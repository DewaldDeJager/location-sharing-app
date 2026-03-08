import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { z } from "zod";
import { listGroups } from "../../services/group-service";

const ListGroupsSchema = z.object({
  includeMembers: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? false : val !== "false"))
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

  const queryResult = ListGroupsSchema.safeParse(event.queryStringParameters ?? {});
  if (!queryResult.success) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Bad Request", errors: queryResult.error.errors }),
    };
  }

  const { includeMembers } = queryResult.data;

  try {
    const groups = await listGroups(sub, includeMembers);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(groups),
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
