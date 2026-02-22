import { apiFetch, apiFetchJson } from './ApiClient.ts';

enum SharingTargetType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP',
}

type SharingTarget = {
  type: SharingTargetType;
  id: string;
}

enum LocationType {
  PRECISE = 'PRECISE',
  CITY = 'CITY',
  COUNTRY = 'COUNTRY',
  TIMEZONE = 'TIMEZONE',
}

enum DurationType {
  ALWAYS = 'ALWAYS',
  TEMPORARY = 'TEMPORARY',
}

type Duration = {
  type: DurationType;
  period: string; // ISO-8601 format for the duration, for example P/20-02-2026T19:16:00Z/8H for 8 hours after the rule creation time.
};

type SharingRule = {
  enabled: boolean;
  target?: SharingTarget;
  location: LocationType;
  alias?: string; // By default, this will be a generated string like "Always share my exact location with Close Family"
  duration?: Duration;
};

export type SharingConfig = {
  enabled: boolean;
  rules: SharingRule[];
};


// Example instances for tests:

// Always share my timezone publicly
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PUBLIC_TIMEZONE: SharingRule = {
  enabled: true,
  location: LocationType.TIMEZONE,
}

// Always share my exact location with Close Family
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CLOSE_FAMILY: SharingRule = {
  enabled: true,
  target: {
    type: SharingTargetType.GROUP,
    id: "abc-123" // The ID of the "Close Family" group
  },
  location: LocationType.PRECISE
}

// Always share my city with Close Friends
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CLOSE_FRIENDS: SharingRule = {
  enabled: true,
  target: {
    type: SharingTargetType.GROUP,
    id: "dev-321" // The ID of the "Close Friends" group
  },
  location: LocationType.CITY
}

// Share my exact location with a specific person for the next 8 hours
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TEMP_SHARING: SharingRule = {
  enabled: true,
  target: {
    type: SharingTargetType.INDIVIDUAL,
    id: 'derp', // The ID of the specific person
  },
  location: LocationType.PRECISE,
  duration: {
    type: DurationType.TEMPORARY,
    period: 'P/20-02-2026T19:16:00Z/8H',
  },
};

export async function fetchConfig(): Promise<SharingConfig> {
  return apiFetchJson<SharingConfig>('/sharing');
}

export async function updateConfig(): Promise<void> {
  await apiFetch('/sharing', {
    method: 'PUT',
  });
}
