import Geolocation from 'react-native-geolocation-service';
import {
  startLocationTracking,
  stopLocationTracking,
  subscribeToLocation,
  getLastLocation,
  sendLocationToBackend,
} from '../src/services/LocationService';

// Reset module state between tests by re-importing via jest.isolateModules
// would be ideal, but since the module uses module-level state we reset
// manually via stop + clearing mocks.

beforeEach(() => {
  stopLocationTracking();
  jest.clearAllMocks();
});

describe('LocationService', () => {
  it('should call Geolocation.watchPosition when tracking starts', () => {
    startLocationTracking();
    expect(Geolocation.watchPosition).toHaveBeenCalledTimes(1);
  });

  it('should not start a second watcher if already tracking', () => {
    startLocationTracking();
    startLocationTracking();
    expect(Geolocation.watchPosition).toHaveBeenCalledTimes(1);
  });

  it('should notify subscribers with location data', () => {
    const listener = jest.fn();
    subscribeToLocation(listener);
    startLocationTracking();

    expect(listener).toHaveBeenCalledWith({
      latitude: 37.78825,
      longitude: -122.4324,
    });
  });

  it('should update lastLocation after receiving a position', () => {
    startLocationTracking();
    const last = getLastLocation();
    expect(last).toEqual({latitude: 37.78825, longitude: -122.4324});
  });

  it('should call Geolocation.clearWatch when stopping', () => {
    startLocationTracking();
    stopLocationTracking();
    expect(Geolocation.clearWatch).toHaveBeenCalled();
  });

  it('unsubscribe should remove listener from future updates', () => {
    // Start tracking first so lastLocation is populated.
    startLocationTracking();
    stopLocationTracking();
    jest.clearAllMocks();

    const listener = jest.fn();
    const unsub = subscribeToLocation(listener);
    // listener is called once immediately with the cached lastLocation.
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
    listener.mockClear();

    // Start tracking again — the unsubscribed listener should NOT be called.
    startLocationTracking();
    expect(listener).not.toHaveBeenCalled();
  });

  it('sendLocationToBackend should resolve without error', async () => {
    await expect(
      sendLocationToBackend({latitude: 1, longitude: 2}),
    ).resolves.toBeUndefined();
  });
});
