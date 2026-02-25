/** The mode of a sharing rule. */
export enum SharingMode {
  DISALLOWED = 'DISALLOWED',
  ALWAYS = 'ALWAYS',
  TEMPORARY = 'TEMPORARY',
}

/** Target type for a sharing rule. */
export enum SharingTargetType {
  PUBLIC = 'PUBLIC',
  GROUP = 'GROUP',
  USER = 'USER',
}

/** Duration presets for temporary sharing. */
export type TemporaryPreset = {
  label: string;
  minutes: number;
};

export const TEMPORARY_PRESETS: TemporaryPreset[] = [
  {label: '15 min', minutes: 15},
  {label: '1 hour', minutes: 60},
  {label: '8 hours', minutes: 480},
];

/** A sharing rule controlling who can see my location. */
export type SharingRule = {
  id: string;
  targetType: SharingTargetType;
  targetId?: string;        // undefined for PUBLIC
  targetName?: string;      // Display name (group name or person name)
  mode: SharingMode;
  endsAt?: string;          // ISO-8601 datetime for TEMPORARY rules
};

/** Full sharing configuration. */
export type SharingConfig = {
  rules: SharingRule[];
};

// --- Helper functions ---

/** Check if a temporary rule is still active. */
export function isTemporaryActive(rule: SharingRule): boolean {
  if (rule.mode !== SharingMode.TEMPORARY || !rule.endsAt) {
    return false;
  }
  return new Date(rule.endsAt).getTime() > Date.now();
}

/** Format a human-readable summary for a rule. */
export function formatRuleSummary(rule: SharingRule): string {
  switch (rule.mode) {
    case SharingMode.DISALLOWED:
      return 'Not sharing';
    case SharingMode.ALWAYS:
      return 'Always sharing';
    case SharingMode.TEMPORARY: {
      if (!rule.endsAt) {
        return 'Temporary (unknown end)';
      }
      if (!isTemporaryActive(rule)) {
        return 'Expired';
      }
      const end = new Date(rule.endsAt);
      const hours = end.getHours().toString().padStart(2, '0');
      const mins = end.getMinutes().toString().padStart(2, '0');
      return `Sharing until ${hours}:${mins}`;
    }
    default:
      return 'Unknown';
  }
}

/** Determine the badge variant for a rule's current state. */
export function ruleBadgeVariant(rule: SharingRule): 'success' | 'warning' | 'neutral' {
  switch (rule.mode) {
    case SharingMode.ALWAYS:
      return 'success';
    case SharingMode.TEMPORARY:
      return isTemporaryActive(rule) ? 'warning' : 'neutral';
    case SharingMode.DISALLOWED:
    default:
      return 'neutral';
  }
}

/**
 * Compute why a given person is allowed to see my location.
 * Checks: public rule, direct user rule, group rules.
 */
export function computeAllowedReasonForFriend(
  personId: string,
  personGroupIds: string[],
  rules: SharingRule[],
): {reason: 'public' | 'direct' | 'group' | 'none'; groupName?: string} {
  // Check public rule
  const publicRule = rules.find(
    r => r.targetType === SharingTargetType.PUBLIC,
  );
  if (publicRule && publicRule.mode !== SharingMode.DISALLOWED) {
    if (publicRule.mode === SharingMode.ALWAYS || isTemporaryActive(publicRule)) {
      return {reason: 'public'};
    }
  }

  // Check direct user rule
  const userRule = rules.find(
    r => r.targetType === SharingTargetType.USER && r.targetId === personId,
  );
  if (userRule && userRule.mode !== SharingMode.DISALLOWED) {
    if (userRule.mode === SharingMode.ALWAYS || isTemporaryActive(userRule)) {
      return {reason: 'direct'};
    }
  }

  // Check group rules
  for (const groupId of personGroupIds) {
    const groupRule = rules.find(
      r => r.targetType === SharingTargetType.GROUP && r.targetId === groupId,
    );
    if (groupRule && groupRule.mode !== SharingMode.DISALLOWED) {
      if (groupRule.mode === SharingMode.ALWAYS || isTemporaryActive(groupRule)) {
        return {reason: 'group', groupName: groupRule.targetName};
      }
    }
  }

  return {reason: 'none'};
}

/** Compute an endsAt ISO string from now + minutes. */
export function computeEndsAt(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}
