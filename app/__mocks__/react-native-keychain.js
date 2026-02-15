let store = {};

module.exports = {
  setGenericPassword: jest.fn(async (username, password, options) => {
    const service = options?.service || 'default';
    store[service] = {username, password};
    return true;
  }),
  getGenericPassword: jest.fn(async (options) => {
    const service = options?.service || 'default';
    if (store[service]) {
      return store[service];
    }
    return false;
  }),
  resetGenericPassword: jest.fn(async (options) => {
    const service = options?.service || 'default';
    delete store[service];
    return true;
  }),
  // Helper for tests to reset the in-memory store
  __resetStore: () => {
    store = {};
  },
};
