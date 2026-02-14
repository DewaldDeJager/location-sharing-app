import Geolocation from 'react-native-geolocation-service';

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
 * Stub for sending the user's location to the backend.
 * Replace this implementation with a real API call when the backend is ready.
 */
export async function sendLocationToBackend(location: Location): Promise<void> {
  // TODO: Replace with actual API call, e.g.:
  // await fetch('https://api.example.com/location', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(location),
  // });
  console.log('[LocationService] Sending location to backend:', location);
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
