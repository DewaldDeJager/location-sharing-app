/** A person the current user follows. */
export type Person = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  groupIds: string[];
};

/** A group of people. */
export type Group = {
  id: string;
  name: string;
  memberIds: string[];
  sortOrder: number;
};

export type FriendLocation = {
  latitude: number;
  longitude: number;
  timestampIso: string;
  timestampMs: number;
};

export type Friend = {
  id: string;
  name?: string;
  username: string;
  groups: BasicGroup[];
  location?: FriendLocation;
};

export type BasicGroup = {
  id: string;
  name: string;
};

/** Visibility reason explaining why a person can (or cannot) see my location. */
export type VisibilityReason =
  | 'public'    // Public rule allows everyone
  | 'direct'    // User-specific rule
  | 'group'     // Allowed via a group
  | 'none';     // Not sharing

export type VisibilityInfo = {
  reason: VisibilityReason;
  groupName?: string; // If reason is 'group', which group grants access
};

/** Search result for finding new people to follow. */
export type PersonSearchResult = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isFollowing: boolean;
};
