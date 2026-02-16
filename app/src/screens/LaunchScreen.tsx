import React, {useEffect, useState} from 'react';
import {StyleSheet, View, Text, ActivityIndicator} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
    <View style={styles.container}>
      <Ionicons name="location" size={64} color="#e74c3c" style={styles.logoIcon} />
      <Text style={styles.appName}>Location Sharing</Text>
      <ActivityIndicator size="large" style={styles.spinner} />
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logoIcon: {
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 16,
  },
  status: {
    fontSize: 16,
    color: '#666',
  },
});

export default LaunchScreen;
