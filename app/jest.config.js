module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-maps|react-native-geolocation-service|react-native-screens|react-native-safe-area-context|@react-navigation/native-stack)/)',
  ],
  moduleNameMapper: {
    'react-native-maps': '<rootDir>/__mocks__/react-native-maps.js',
    'react-native-geolocation-service':
      '<rootDir>/__mocks__/react-native-geolocation-service.js',
  },
};
