export default {
  requestAuthorization: jest.fn(() => Promise.resolve('granted')),
  getCurrentPosition: jest.fn((success, _error, _options) => {
    success({
      coords: {
        latitude: 37.78825,
        longitude: -122.4324,
        altitude: 0,
        accuracy: 5,
        altitudeAccuracy: -1,
        heading: -1,
        speed: -1,
      },
      timestamp: Date.now(),
    });
  }),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
};
