import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { UserProfile } from "../domain/types";
import { addFriend } from "./friend-service";
import { createGroup } from "./group-service";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export async function getUserName(userId: string): Promise<string | null> {
  const tableName = process.env.USER_PROFILE_TABLE_NAME || "UserProfile";

  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { userId },
    })
  );

  return result.Item?.name ?? null;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const tableName = process.env.USER_PROFILE_TABLE_NAME || "UserProfile";

  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { userId },
    })
  );

  return {
    userId: userId,
    username: result.Item?.username,
    email: result.Item?.email,
    name: result.Item?.name ?? result.Item?.username,
  };
}

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

  if (process.env.ENVIRONMENT === "dev") {
    await addFriend(profile.userId, "22be994a-dd01-45a5-b119-005fa28b3a72", "Alice Johnson");
    await addFriend(profile.userId, "6013c17a-f0a8-4ebd-a0e3-c2b3c966c9fb", "Bob Smith");
    await addFriend(profile.userId, "6406ec2b-31db-48ed-aafc-0881530a6f20", "Carol Williams");
    await addFriend(profile.userId, "6b5b7894-9f07-4db2-b513-59dd12494f1b", "Dave Brown");
    await addFriend(profile.userId, "97f387e2-523d-4529-886f-579b94d3f0a8", "Eve Davis");

    await createGroup(profile.userId, "Family", [
      "22be994a-dd01-45a5-b119-005fa28b3a72",
      "6013c17a-f0a8-4ebd-a0e3-c2b3c966c9fb",
      "97f387e2-523d-4529-886f-579b94d3f0a8",
    ]);

    await createGroup(profile.userId, "Friends", [
      "6013c17a-f0a8-4ebd-a0e3-c2b3c966c9fb",
      "6406ec2b-31db-48ed-aafc-0881530a6f20",
    ]);
  }
}
