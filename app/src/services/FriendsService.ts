import {AUTH_CONFIG} from '../config/auth';
import {getAccessToken} from './AuthService';

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

/**
 * Fetch the friend list from the API.
 */
export async function fetchFriends(): Promise<FriendsResponse> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('User is not authenticated');
  }

  const response = await fetch(`${AUTH_CONFIG.apiBaseUrl}/friends`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch friends: ${response.statusText}`);
  }

  return response.json();
}
