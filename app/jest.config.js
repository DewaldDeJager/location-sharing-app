module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-maps|react-native-geolocation-service|react-native-vector-icons|react-native-screens|react-native-safe-area-context|@react-navigation/native-stack|react-native-app-auth|react-native-keychain)/)',
  ],
  moduleNameMapper: {
    'react-native-maps': '<rootDir>/__mocks__/react-native-maps.js',
    'react-native-geolocation-service':
      '<rootDir>/__mocks__/react-native-geolocation-service.js',
    'react-native-vector-icons/Ionicons':
      '<rootDir>/__mocks__/react-native-vector-icons/Ionicons.js',
    'react-native-app-auth': '<rootDir>/__mocks__/react-native-app-auth.js',
    'react-native-keychain': '<rootDir>/__mocks__/react-native-keychain.js',
  },
};
