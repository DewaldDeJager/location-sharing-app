import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {subscribeToLocation} from '../services/LocationService';
import type {Location} from '../services/LocationService';
import {getTokens, getUserSub, getUserEmail} from '../services/AuthService';

type Props = {
  onSignOut: () => void;
};

function ProfileScreen({onSignOut}: Props) {
  const [location, setLocation] = useState<Location | null>(null);
  const [userSub, setUserSub] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToLocation(loc => {
      setLocation(loc);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    (async () => {
      const tokens = await getTokens();
      if (tokens?.idToken) {
        setUserSub(getUserSub(tokens.idToken));
        setUserEmail(getUserEmail(tokens.idToken));
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.name}>
          {userEmail ?? 'User'}
        </Text>
        {userSub && (
          <Text style={styles.sub}>Sub: {userSub}</Text>
        )}
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

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={onSignOut}
        testID="sign-out-button">
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
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
    marginBottom: 8,
  },
  sub: {
    fontSize: 12,
    color: '#999',
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
  signOutButton: {
    marginTop: 24,
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
