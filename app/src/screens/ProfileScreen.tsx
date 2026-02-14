import React, {useEffect, useState} from 'react';
import {StyleSheet, View, Text, ActivityIndicator} from 'react-native';
import {subscribeToLocation} from '../services/LocationService';
import type {Location} from '../services/LocationService';

function ProfileScreen() {
  const [location, setLocation] = useState<Location | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToLocation(loc => {
      setLocation(loc);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.label}>Current Coordinates</Text>
        {location ? (
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
});

export default ProfileScreen;
