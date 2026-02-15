import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from "aws-lambda";

export type FriendLocation = {
  lat: number;
  lng: number;
};

export type Friend = {
  id: string;
  username: string;
  displayName: string;
  lastLocation: FriendLocation | null;
  lastLocationAt: string | null;
  groupIds: string[];
};

export type Group = {
  id: string;
  name: string;
  sortOrder: number;
};

export type FriendsResponse = {
  generatedAt: string;
  groups: Group[];
  friends: Friend[];
};

const MOCK_DATA: FriendsResponse = {
  generatedAt: '2026-02-15T22:03:12Z',
  groups: [
    {id: 'g_family', name: 'Family', sortOrder: 10},
    {id: 'g_close', name: 'Close Friends', sortOrder: 20},
    {id: 'g_friends', name: 'Friends', sortOrder: 30},
  ],
  friends: [
    {
      id: 'f_001',
      username: 'mia_nkosi',
      displayName: 'Mia Nkosi',
      lastLocation: {lat: -26.2041, lng: 28.0473},
      lastLocationAt: '2026-02-15T21:58:41Z',
      groupIds: ['g_close', 'g_friends'],
    },
    {
      id: 'f_002',
      username: 'liam_v',
      displayName: 'Liam Venter',
      lastLocation: {lat: -33.9249, lng: 18.4241},
      lastLocationAt: '2026-02-15T21:12:03Z',
      groupIds: ['g_family'],
    },
    {
      id: 'f_003',
      username: 'aisha_k',
      displayName: 'Aisha Khan',
      lastLocation: null,
      lastLocationAt: null,
      groupIds: [],
    },
    {
      id: 'f_004',
      username: 'sam.dev',
      displayName: 'Sam',
      lastLocation: {lat: -29.8587, lng: 31.0218},
      lastLocationAt: '2026-02-15T21:49:10Z',
      groupIds: ['g_friends'],
    },
  ],
};

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

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(MOCK_DATA),
  };
};
