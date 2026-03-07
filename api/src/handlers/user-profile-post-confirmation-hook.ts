import { PostConfirmationTriggerEvent } from "aws-lambda";
import { createUserProfile } from "../services/user-profile-service";

export const handler = async (
  event: PostConfirmationTriggerEvent
): Promise<PostConfirmationTriggerEvent> => {
  console.log(JSON.stringify(event));

  const attrs = event.request.userAttributes;

  try {
    await createUserProfile({
      userId: attrs.sub,
      username: attrs.email,
      email: attrs.email,
      name: attrs.name,
    });
  } catch (err) {
    console.error("DynamoDB put error", err);
    throw err;
  }

  return event;
};
