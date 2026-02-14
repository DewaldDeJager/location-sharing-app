import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {
  subscribeToLocation,
  startLocationTracking,
  stopLocationTracking,
} from '../services/LocationService';
import type {Location} from '../services/LocationService';

async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const status = await Geolocation.requestAuthorization('always');
    return status === 'granted';
  }

  if (Platform.OS === 'android') {
    const fineGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message:
          'This app needs access to your location to display your coordinates.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
        buttonNeutral: 'Ask Me Later',
      },
    );
    if (fineGranted !== PermissionsAndroid.RESULTS.GRANTED) {
      return false;
    }

    if (Number(Platform.Version) >= 29) {
      const bgGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Background Location Permission',
          message:
            'This app needs access to your location in the background so it can track your position even when the app is closed.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
          buttonNeutral: 'Ask Me Later',
        },
      );
      return bgGranted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  }

  return false;
}

function ProfileScreen() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    (async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setError('Location permission not granted');
        return;
      }

      // Subscribe to live location updates from the service.
      unsubscribe = subscribeToLocation(loc => {
        setLocation(loc);
      });

      // Start tracking (no-op if already started).
      startLocationTracking();
    })();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      stopLocationTracking();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.label}>Current Coordinates</Text>
        {error ? (
          <Text style={styles.error}>Error: {error}</Text>
        ) : location ? (
          <View>
            <Text style={styles.coordinate}>
              Latitude: {location.latitude.toFixed(6)}
            </Text>
            <Text style={styles.coordinate}>
              Longitude: {location.longitude.toFixed(6)}
            </Text>
          </View>
        ) : (
          <ActivityIndicator size="small" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  coordinate: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  error: {
    fontSize: 14,
    color: 'red',
  },
});

export default ProfileScreen;
