import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { UserProfile } from "../domain/types";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const tableName = process.env.USER_PROFILE_TABLE_NAME || "UserProfile";

  const item: Record<string, unknown> = {
    userId: profile.userId,
    username: profile.username,
  };
  if (profile.email) {
    item.email = profile.email;
  }
  if (profile.name) {
    item.name = profile.name;
  }

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );
}
