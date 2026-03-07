/**
 * SocialService — unified data layer for the Social UI.
 * Wraps FriendsService and SharingService, adding mock adapters where
 * real endpoints aren't ready. Replace mock implementations with real
 * API calls when backend is available.
 */

import {fetchFriends} from './FriendsService';
import {apiFetch, apiFetchJson} from './ApiClient';
import type {Person, Group, PersonSearchResult} from '../types/social';
import {
  SharingMode,
  SharingTargetType,
  computeEndsAt,
} from '../types/sharing';
import type {SharingRule, SharingConfig} from '../types/sharing';

// ---------------------------------------------------------------------------
// In-memory mock state (replace with real API calls)
// ---------------------------------------------------------------------------

let mockPeople: Person[] = [
  {id: '22be994a-dd01-45a5-b119-005fa28b3a72', username: 'alice', displayName: 'Alice Johnson', groupIds: ['g1']},
  {id: '6013c17a-f0a8-4ebd-a0e3-c2b3c966c9fb', username: 'bob', displayName: 'Bob Smith', groupIds: ['g1', 'g2']},
  {id: '6406ec2b-31db-48ed-aafc-0881530a6f20', username: 'carol', displayName: 'Carol Williams', groupIds: ['g2']},
  {id: '6b5b7894-9f07-4db2-b513-59dd12494f1b', username: 'dave', displayName: 'Dave Brown', groupIds: []},
  {id: '97f387e2-523d-4529-886f-579b94d3f0a8', username: 'eve', displayName: 'Eve Davis', groupIds: ['g1']},
];

let mockGroups: Group[] = [
  {id: 'g1', name: 'Family', memberIds: ['u1', 'u2', 'u5'], sortOrder: 0},
  {id: 'g2', name: 'Close Friends', memberIds: ['u2', 'u3'], sortOrder: 1},
];

let mockRules: SharingRule[] = [
  {id: 'r-public', targetType: SharingTargetType.PUBLIC, mode: SharingMode.DISALLOWED},
  {id: 'r-g1', targetType: SharingTargetType.GROUP, targetId: 'g1', targetName: 'Family', mode: SharingMode.ALWAYS},
  {id: 'r-g2', targetType: SharingTargetType.GROUP, targetId: 'g2', targetName: 'Close Friends', mode: SharingMode.DISALLOWED},
];

const mockSearchDatabase: PersonSearchResult[] = [
  {id: 'c8782828-6e9a-47d0-91e2-78f36eadfee6', username: 'frank', displayName: 'Frank Miller', isFollowing: false},
  {id: '6a5caa20-88aa-4fc4-b925-f3e4572dd426', username: 'grace', displayName: 'Grace Lee', isFollowing: false},
  {id: '3adc17a9-3961-4f73-b15b-2fd6dbd2affe', username: 'heidi', displayName: 'Heidi Clark', isFollowing: false},
  {id: '22be994a-dd01-45a5-b119-005fa28b3a72', username: 'alice', displayName: 'Alice Johnson', isFollowing: true},
  {id: '6013c17a-f0a8-4ebd-a0e3-c2b3c966c9fb', username: 'bob', displayName: 'Bob Smith', isFollowing: true},
  {id: '6406ec2b-31db-48ed-aafc-0881530a6f20', username: 'carol', displayName: 'Carol Williams', isFollowing: true},
  {id: '6b5b7894-9f07-4db2-b513-59dd12494f1b', username: 'dave', displayName: 'Dave Brown', isFollowing: true},
  {id: '97f387e2-523d-4529-886f-579b94d3f0a8', username: 'eve', displayName: 'Eve Davis', isFollowing: true},
];

// Simulate network delay
const delay = (ms: number = 300) => new Promise<void>(res => setTimeout(res, ms));

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export async function getPeople(): Promise<Person[]> {
  await delay();
  return [...mockPeople];
}

export async function followPerson(personId: string): Promise<void> {
  await delay(200);
  const result = mockSearchDatabase.find(p => p.id === personId);
  if (result && !mockPeople.find(p => p.id === personId)) {
    mockPeople.push({
      id: result.id,
      username: result.username,
      displayName: result.displayName,
      groupIds: [],
    });
  }
}

export async function unfollowPerson(personId: string): Promise<void> {
  await delay(200);
  mockPeople = mockPeople.filter(p => p.id !== personId);
  // Also remove from groups
  mockGroups = mockGroups.map(g => ({
    ...g,
    memberIds: g.memberIds.filter(id => id !== personId),
  }));
  // Remove user rules
  mockRules = mockRules.filter(
    r => !(r.targetType === SharingTargetType.USER && r.targetId === personId),
  );
}

export async function searchPeople(query: string): Promise<PersonSearchResult[]> {
  await delay(400);
  if (!query.trim()) {
    return [];
  }
  const q = query.toLowerCase();
  const followedIds = new Set(mockPeople.map(p => p.id));
  return mockSearchDatabase
    .filter(
      p =>
        p.username.toLowerCase().includes(q) ||
        p.displayName.toLowerCase().includes(q),
    )
    .map(p => ({...p, isFollowing: followedIds.has(p.id)}));
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export async function getGroups(): Promise<Group[]> {
  const data = await apiFetchJson<{id: string; name: string}[]>('/groups');
  return data.map((g, index) => ({
    id: g.id,
    name: g.name,
    memberIds: [],
    sortOrder: index,
  }));
}

export async function getGroup(groupId: string): Promise<Group | undefined> {
  try {
    const data = await apiFetchJson<{id: string; name: string}>(`/groups/${groupId}`);
    return {
      id: data.id,
      name: data.name,
      memberIds: [],
      sortOrder: 0,
    };
  } catch {
    return undefined;
  }
}

export async function createGroup(
  name: string,
  memberIds: string[],
  ruleMode: SharingMode = SharingMode.DISALLOWED,
  temporaryMinutes?: number,
): Promise<Group> {
  const data = await apiFetchJson<{id: string; name: string}>('/groups', {
    method: 'POST',
    body: {name, members: memberIds},
  });
  const id = data.id;
  const group: Group = {
    id,
    name: data.name,
    memberIds,
    sortOrder: 0,
  };

  // Create rule - Leave this as a mock for now
  const rule: SharingRule = {
    id: `r-${id}`,
    targetType: SharingTargetType.GROUP,
    targetId: id,
    targetName: name,
    mode: ruleMode,
    endsAt:
      ruleMode === SharingMode.TEMPORARY && temporaryMinutes
        ? computeEndsAt(temporaryMinutes)
        : undefined,
  };
  mockRules.push(rule);

  return group;
}

export async function updateGroup(
  groupId: string,
  updates: {name?: string; memberIds?: string[]},
): Promise<void> {
  const body: {name?: string; members?: string[]} = {};
  if (updates.name !== undefined) {
    body.name = updates.name;
  }
  if (updates.memberIds !== undefined) {
    body.members = updates.memberIds;
  }
  await apiFetchJson(`/groups/${groupId}`, {
    method: 'PATCH',
    body,
  });
}

export async function deleteGroup(groupId: string): Promise<void> {
  const res = await apiFetch(`/groups/${groupId}`, {method: 'DELETE'});
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ''}`);
  }
}

// ---------------------------------------------------------------------------
// Sharing Rules
// ---------------------------------------------------------------------------

export async function getSharingRules(): Promise<SharingRule[]> {
  await delay();
  return [...mockRules];
}

export async function updateSharingRule(
  targetType: SharingTargetType,
  targetId: string | undefined,
  mode: SharingMode,
  temporaryMinutes?: number,
): Promise<SharingRule> {
  await delay(200);

  const existing = mockRules.find(
    r =>
      r.targetType === targetType &&
      (targetId ? r.targetId === targetId : r.targetType === SharingTargetType.PUBLIC),
  );

  const endsAt =
    mode === SharingMode.TEMPORARY && temporaryMinutes
      ? computeEndsAt(temporaryMinutes)
      : undefined;

  if (existing) {
    const updated = {...existing, mode, endsAt};
    mockRules = mockRules.map(r => (r.id === existing.id ? updated : r));
    return updated;
  }

  // Create new rule
  let targetName: string | undefined;
  if (targetType === SharingTargetType.GROUP) {
    targetName = mockGroups.find(g => g.id === targetId)?.name;
  } else if (targetType === SharingTargetType.USER) {
    targetName = mockPeople.find(p => p.id === targetId)?.displayName;
  }

  const newRule: SharingRule = {
    id: `r-${targetType}-${targetId ?? 'public'}-${Date.now()}`,
    targetType,
    targetId,
    targetName,
    mode,
    endsAt,
  };
  mockRules.push(newRule);
  return newRule;
}

export async function stopSharing(
  targetType: SharingTargetType,
  targetId?: string,
): Promise<void> {
  await delay(200);
  mockRules = mockRules.map(r => {
    if (
      r.targetType === targetType &&
      (targetId ? r.targetId === targetId : r.targetType === SharingTargetType.PUBLIC)
    ) {
      return {...r, mode: SharingMode.DISALLOWED, endsAt: undefined};
    }
    return r;
  });
}

export async function extendSharing(
  targetType: SharingTargetType,
  targetId: string | undefined,
  additionalMinutes: number,
): Promise<SharingRule | undefined> {
  await delay(200);
  let updated: SharingRule | undefined;
  mockRules = mockRules.map(r => {
    if (
      r.targetType === targetType &&
      (targetId ? r.targetId === targetId : r.targetType === SharingTargetType.PUBLIC)
    ) {
      const currentEnd = r.endsAt ? new Date(r.endsAt).getTime() : Date.now();
      const newEnd = new Date(
        Math.max(currentEnd, Date.now()) + additionalMinutes * 60 * 1000,
      ).toISOString();
      updated = {...r, endsAt: newEnd};
      return updated;
    }
    return r;
  });
  return updated;
}
