/**
 * SocialService — unified data layer for the Social UI.
 * Wraps FriendsService and SharingService, adding mock adapters where
 * real endpoints aren't ready. Replace mock implementations with real
 * API calls when backend is available.
 */

import {fetchFriends} from './FriendsService';
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
  {id: 'u1', username: 'alice', displayName: 'Alice Johnson', groupIds: ['g1']},
  {id: 'u2', username: 'bob', displayName: 'Bob Smith', groupIds: ['g1', 'g2']},
  {id: 'u3', username: 'carol', displayName: 'Carol Williams', groupIds: ['g2']},
  {id: 'u4', username: 'dave', displayName: 'Dave Brown', groupIds: []},
  {id: 'u5', username: 'eve', displayName: 'Eve Davis', groupIds: ['g1']},
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
  {id: 'u6', username: 'frank', displayName: 'Frank Miller', isFollowing: false},
  {id: 'u7', username: 'grace', displayName: 'Grace Lee', isFollowing: false},
  {id: 'u8', username: 'heidi', displayName: 'Heidi Clark', isFollowing: false},
  {id: 'u1', username: 'alice', displayName: 'Alice Johnson', isFollowing: true},
  {id: 'u2', username: 'bob', displayName: 'Bob Smith', isFollowing: true},
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
  await delay();
  return [...mockGroups].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getGroup(groupId: string): Promise<Group | undefined> {
  await delay(100);
  return mockGroups.find(g => g.id === groupId);
}

let nextGroupId = 100;

export async function createGroup(
  name: string,
  memberIds: string[],
  ruleMode: SharingMode = SharingMode.DISALLOWED,
  temporaryMinutes?: number,
): Promise<Group> {
  await delay(300);
  const id = `g-${nextGroupId++}`;
  const group: Group = {
    id,
    name,
    memberIds,
    sortOrder: mockGroups.length,
  };
  mockGroups.push(group);

  // Update people's groupIds
  mockPeople = mockPeople.map(p =>
    memberIds.includes(p.id) ? {...p, groupIds: [...p.groupIds, id]} : p,
  );

  // Create rule
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
  await delay(200);
  mockGroups = mockGroups.map(g => {
    if (g.id !== groupId) {
      return g;
    }
    const updated = {...g};
    if (updates.name !== undefined) {
      updated.name = updates.name;
      // Also update rule targetName
      mockRules = mockRules.map(r =>
        r.targetId === groupId ? {...r, targetName: updates.name} : r,
      );
    }
    if (updates.memberIds !== undefined) {
      const oldMemberIds = g.memberIds;
      const newMemberIds = updates.memberIds;
      // Remove group from old members not in new list
      const removed = oldMemberIds.filter(id => !newMemberIds.includes(id));
      const added = newMemberIds.filter(id => !oldMemberIds.includes(id));
      mockPeople = mockPeople.map(p => {
        if (removed.includes(p.id)) {
          return {...p, groupIds: p.groupIds.filter(gid => gid !== groupId)};
        }
        if (added.includes(p.id)) {
          return {...p, groupIds: [...p.groupIds, groupId]};
        }
        return p;
      });
      updated.memberIds = newMemberIds;
    }
    return updated;
  });
}

export async function deleteGroup(groupId: string): Promise<void> {
  await delay(200);
  mockGroups = mockGroups.filter(g => g.id !== groupId);
  mockPeople = mockPeople.map(p => ({
    ...p,
    groupIds: p.groupIds.filter(gid => gid !== groupId),
  }));
  mockRules = mockRules.filter(r => r.targetId !== groupId);
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
