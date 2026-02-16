import Geolocation from 'react-native-geolocation-service';
import {apiFetch} from './ApiClient';
import DeviceService from './DeviceService';

export type Location = {
  latitude: number;
  longitude: number;
};

type LocationListener = (location: Location) => void;

const LOCATION_UPDATE_INTERVAL = 5000; // milliseconds

let watchId: number | null = null;
let listeners: LocationListener[] = [];
let lastLocation: Location | null = null;

/**
 * Send the user's location to the backend.
 */
export async function sendLocationToBackend(location: Location): Promise<void> {
    console.log("Publishing location...")
    // Include timestamp (ISO-8601) and deviceId in the payload
  try {
    const timestamp = new Date().toISOString();
    // Ensure a device ID exists; falls back to null-safe get if ensure somehow fails
    let deviceId: string | null;
    try {
      deviceId = await DeviceService.ensureDeviceId();
    } catch {
      deviceId = await DeviceService.getDeviceId();
    }

    const payload = {
      ...location,
      timestamp,
      deviceId: deviceId ?? undefined,
    };

    const res = await apiFetch('/location', {
      method: 'POST',
      body: payload,
      asJson: true,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('[LocationService] Failed to send location:', res.status, res.statusText, text);
    }
  } catch (e: any) {
    console.warn('[LocationService] Error sending location:', e?.message || String(e));
  }
}

/**
 * Subscribe to location updates. Returns an unsubscribe function.
 */
export function subscribeToLocation(listener: LocationListener): () => void {
  listeners.push(listener);

  // Immediately emit the last known location if available.
  if (lastLocation) {
    listener(lastLocation);
  }

  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

/**
 * Start watching the user's location. Should be called once after permissions
 * have been granted.
 */
export function startLocationTracking(): void {
  if (watchId !== null) {
    return; // already tracking
  }

  watchId = Geolocation.watchPosition(
    position => {
      const loc: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      lastLocation = loc;

      // Notify all subscribers.
      listeners.forEach(l => l(loc));

      // Send to backend (fire-and-forget).
      sendLocationToBackend(loc);
    },
    error => {
      console.warn('[LocationService] watchPosition error:', error.message);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 5, // minimum distance (metres) before an update is fired
      interval: LOCATION_UPDATE_INTERVAL,
      fastestInterval: LOCATION_UPDATE_INTERVAL / 2,
    },
  );
}

/**
 * Stop watching the user's location.
 */
export function stopLocationTracking(): void {
  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }
}

/**
 * Return the last known location, or null if none has been received yet.
 */
export function getLastLocation(): Location | null {
  return lastLocation;
}
