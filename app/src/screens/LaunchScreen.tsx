import React, {useEffect, useState} from 'react';
import {ActivityIndicator} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@shopify/restyle';
import {Screen, Text} from '../theme';
import type {Theme} from '../theme';
import {requestLocationPermission} from '../services/PermissionService';
import {
  subscribeToLocation,
  startLocationTracking,
} from '../services/LocationService';
import DeviceService from '../services/DeviceService';

type Props = {
  onReady: () => void;
};

function LaunchScreen({onReady}: Props) {
  const [status, setStatus] = useState('Initializing device…');
  const theme = useTheme<Theme>();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    (async () => {
      // Ensure we have a stable device identifier stored before proceeding
      try {
        await DeviceService.ensureDeviceId();
      } catch (e) {
        // Non-fatal: proceed even if storage fails, but surface status
        setStatus('Unable to initialize device ID');
      }

      setStatus('Requesting permissions…');
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setStatus('Location permission not granted');
        return;
      }

      setStatus('Loading your location…');

      unsubscribe = subscribeToLocation(() => {
        // First location received – we're ready.
        onReady();
      });

      startLocationTracking();
    })();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [onReady]);

  return (
    <Screen
      justifyContent="center"
      alignItems="center"
      backgroundColor="white">
      <Ionicons
        name="location"
        size={64}
        color={theme.colors.danger}
        style={{marginBottom: theme.spacing.l}}
      />
      <Text
        variant="title"
        fontSize={32}
        marginBottom="xl">
        Location Sharing
      </Text>
      <ActivityIndicator
        size="large"
        style={{marginBottom: theme.spacing.l}}
      />
      <Text variant="body" color="muted">{status}</Text>
    </Screen>
  );
}

export default LaunchScreen;
