import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

const DEVICE_ID_KEY = 'device_id';

let cachedDeviceId: string | null = null;
let initializationPromise: Promise<string> | null = null;

export async function getDeviceId(): Promise<string | null> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }
  const fromStorage = await AsyncStorage.getItem(DEVICE_ID_KEY);
  cachedDeviceId = fromStorage;
  return fromStorage;
}

export async function ensureDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  // Prevent concurrent initializations from generating multiple IDs
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (existing) {
        cachedDeviceId = existing;
        return existing;
      }

      const newId = uuid.v4().toString();
      // Best effort write; even if concurrent, last write wins with same semantics
      await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
      cachedDeviceId = newId;
      return newId;
    } finally {
      // Reset promise after completion to avoid holding stale promise forever
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

const DeviceService = {
  getDeviceId,
  ensureDeviceId,
};

export default DeviceService;
