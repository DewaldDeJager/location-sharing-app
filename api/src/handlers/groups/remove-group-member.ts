import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";
import { z } from "zod";
import { removeGroupMember } from "../../services/group-service";
import { NotFoundError } from "../../domain/types";

const ParamsSchema = z.object({
  groupId: z.string().uuid({ message: "groupId must be a valid UUID" }),
  memberId: z.string().uuid({ message: "memberId must be a valid UUID" }),
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

  const parsedParams = ParamsSchema.safeParse({
    groupId: event.pathParameters?.groupId,
    memberId: event.pathParameters?.memberId,
  });
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

  const { groupId, memberId } = parsedParams.data;

  try {
    await removeGroupMember(sub, groupId, memberId);
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
    console.error("DynamoDB transact write error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
