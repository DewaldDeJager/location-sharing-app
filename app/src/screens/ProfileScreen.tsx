import React, {useEffect, useState, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {getTokens, getUserSub, getUserEmail, getUserName} from '../services/AuthService';
import {fetchProfile} from '../services/ProfileService';
import type {ProfileResponse} from '../services/ProfileService';

type Props = {
  onSignOut: () => void;
};

function ProfileScreen({onSignOut}: Props) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [userSub, setUserSub] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchProfile();
      setProfile(data);
    } catch (error) {
      console.warn('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    (async () => {
      const tokens = await getTokens();
      if (tokens?.idToken) {
        setUserSub(getUserSub(tokens.idToken));
        setUserEmail(getUserEmail(tokens.idToken));
        setUserName(getUserName(tokens.idToken));
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const location = profile?.lastKnownLocation;

  const DetailRow = ({label, value}: {label: string; value: string}) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.profileCard}>
        <Text style={styles.name}>
          {userName ?? userEmail ?? 'User'}
        </Text>

        <View style={styles.detailsContainer}>
          {userName && userEmail && (
            <DetailRow label="Email" value={userEmail} />
          )}
          {userSub && (
            <DetailRow label="User ID" value={userSub} />
          )}
          {profile?.deviceId && (
            <DetailRow label="Device ID" value={profile.deviceId} />
          )}
        </View>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>Current Location</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : location ? (
          <View style={styles.locationContainer}>
            <DetailRow label="Latitude" value={location.latitude.toFixed(6)} />
            <DetailRow label="Longitude" value={location.longitude.toFixed(6)} />
            {location.formattedAddress && (
              <DetailRow label="Address" value={location.formattedAddress} />
            )}
            {location.timeZoneName && (
              <DetailRow label="Time Zone" value={location.timeZoneName} />
            )}
          </View>
        ) : (
          <Text style={styles.noLocation}>No location data available</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={onSignOut}
        testID="sign-out-button">
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
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
    color: '#333',
    textAlign: 'center',
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    width: '100%',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    width: 85,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    width: '100%',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
    alignSelf: 'center',
  },
  locationContainer: {
    width: '100%',
  },
  noLocation: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
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
