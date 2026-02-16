import {apiFetchJson} from './ApiClient';

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
  return apiFetchJson<FriendsResponse>('/friends');
}
