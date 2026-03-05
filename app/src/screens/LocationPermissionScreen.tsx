import React, {useState} from 'react';
import {ActivityIndicator, Platform, ScrollView} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@shopify/restyle';
import {Screen, Box, Text, Button} from '../theme';
import type {Theme} from '../theme';
import {requestLocationPermission} from '../services/PermissionService';
import {
  subscribeToLocation,
  startLocationTracking,
} from '../services/LocationService';

type Props = {
  onPermissionGranted: () => void;
};

function LocationPermissionScreen({onPermissionGranted}: Props) {
  const theme = useTheme<Theme>();
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsBackgroundNote =
    Platform.OS === 'android' && Number(Platform.Version) >= 29;

  const handleGrantPermission = async () => {
    setRequesting(true);
    setError(null);

    const granted = await requestLocationPermission();

    if (!granted) {
      setRequesting(false);
      setError(
        'Location permission was not granted. Please enable it in your device settings to continue.',
      );
      return;
    }

    subscribeToLocation(() => {
      onPermissionGranted();
    });
    startLocationTracking();
  };

  return (
    <Screen backgroundColor="white">
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <Box flex={1} justifyContent="center" paddingHorizontal="l" gap="m">
          <Box alignItems="center" marginBottom="m">
            <Ionicons
              name="location"
              size={64}
              color={theme.colors.danger}
            />
          </Box>

          <Text variant="title" textAlign="center" marginBottom="s">
            Location Permissions
          </Text>

          <Text variant="body" textAlign="center" marginBottom="m">
            This app uses your location to share it with the people you choose.
            You have full control over:
          </Text>

          <Box
            backgroundColor="card"
            borderRadius="m"
            padding="m"
            marginBottom="m"
            gap="s">
            <Box flexDirection="row" alignItems="center" gap="s">
              <Ionicons
                name="people-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text variant="body" flex={1}>
                <Text variant="body" fontWeight="bold">Who</Text> sees your
                location — specific people, groups, or the general public
              </Text>
            </Box>

            <Box flexDirection="row" alignItems="center" gap="s">
              <Ionicons
                name="time-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text variant="body" flex={1}>
                <Text variant="body" fontWeight="bold">How long</Text> you share
                — always, never, or for a short period of time
              </Text>
            </Box>
          </Box>

          <Box
            backgroundColor="card"
            borderRadius="m"
            padding="m"
            marginBottom="m"
            gap="s">
            <Text variant="subtitle" marginBottom="xs">
              What we need
            </Text>

            <Box flexDirection="row" alignItems="center" gap="s">
              <Ionicons
                name="navigate-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text variant="body" flex={1}>
                <Text variant="body" fontWeight="bold">
                  General location permission
                </Text>{' '}
                — so the app can read your position while it is open
              </Text>
            </Box>

            {(Platform.OS === 'ios' || needsBackgroundNote) && (
              <Box flexDirection="row" alignItems="center" gap="s">
                <Ionicons
                  name="cloud-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text variant="body" flex={1}>
                  <Text variant="body" fontWeight="bold">
                    Background location permission
                  </Text>{' '}
                  — so the app can update your position even when it is in the
                  background or closed
                </Text>
              </Box>
            )}
          </Box>

          {error && (
            <Text
              variant="body"
              color="danger"
              textAlign="center"
              marginBottom="s">
              {error}
            </Text>
          )}

          {requesting ? (
            <ActivityIndicator size="large" />
          ) : (
            <Button
              variant="primary"
              label="Grant Location Access"
              icon="location-outline"
              onPress={handleGrantPermission}
            />
          )}
        </Box>
      </ScrollView>
    </Screen>
  );
}

export default LocationPermissionScreen;
