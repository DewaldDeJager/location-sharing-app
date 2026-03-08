export interface Group {
  id: string;
  name?: string;
  members?: Array<String>;
}

export interface Friend {
  id: string;
  username: string;
  name?: string;
  groups?: Array<Group>;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  deviceId: string;
  timestampIso: string;
  timestampMs: number;
}

export interface UserProfile {
  userId: string;
  username: string;
  email?: string;
  name?: string;
}

export interface ProfileLocation {
  userId: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  timestampIso: string;
}

export interface GeocodingInfo {
  formattedAddress: string | null;
  timeZoneId: string | null;
  timeZoneName: string | null;
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
