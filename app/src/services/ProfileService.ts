import {apiFetchJson} from './ApiClient';

export type ProfileLocation = {
  latitude: number;
  longitude: number;
  timestamp: string;
  formattedAddress?: string;
  timeZoneId?: string;
  timeZoneName?: string;
};

export type ProfileResponse = {
  userId: string;
  deviceId: string;
  lastKnownLocation: ProfileLocation | null;
};

/**
 * Fetch the user's own profile from the API.
 */
export async function fetchProfile(): Promise<ProfileResponse> {
  return apiFetchJson<ProfileResponse>('/profile');
}
