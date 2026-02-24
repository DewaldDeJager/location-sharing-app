import { PostConfirmationTriggerEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (
  event: PostConfirmationTriggerEvent
): Promise<PostConfirmationTriggerEvent> => {
  console.log(JSON.stringify(event));

  const tableName = process.env.USER_PROFILE_TABLE_NAME || "UserProfile";

  const attrs = event.request.userAttributes;

  const item: Record<string, unknown> = {
    userId: attrs.sub,
    username: attrs.email,
  };
  if (attrs.email) {
    item.email = attrs.email;
  }
  if (attrs.name) {
    item.name = attrs.name;
  }

  try {
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );
  } catch (err) {
    console.error("DynamoDB put error", err);
    throw err;
  }

  return event;
};
