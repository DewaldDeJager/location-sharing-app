import React, {useCallback} from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

type FriendProfileParams = {
  displayName: string;
  username: string;
  lastLocation: {lat: number; lng: number} | null;
  lastLocationAt: string | null;
};

function FriendProfileScreen({route}: {route: {params: FriendProfileParams}}) {
  const {displayName, username, lastLocation, lastLocationAt} = route.params;
  const navigation = useNavigation<any>();

  const handleViewOnMap = useCallback(() => {
    if (lastLocation) {
      navigation.navigate('Map', {
        friendMarker: {
          lat: lastLocation.lat,
          lng: lastLocation.lng,
          displayName,
        },
      });
    }
  }, [navigation, lastLocation, displayName]);

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.username}>@{username}</Text>
        <Text style={styles.label}>Last Known Location</Text>
        {lastLocation ? (
          <View>
            <Text style={styles.coordinate}>
              Latitude: {lastLocation.lat.toFixed(6)}
            </Text>
            <Text style={styles.coordinate}>
              Longitude: {lastLocation.lng.toFixed(6)}
            </Text>
          </View>
        ) : (
          <Text style={styles.coordinate}>No location available</Text>
        )}
        <Text style={styles.label}>Last Location Update</Text>
        {lastLocationAt ? (
          <Text style={styles.coordinate}>
            {new Date(lastLocationAt).toLocaleString()}
          </Text>
        ) : (
          <Text style={styles.coordinate}>Never</Text>
        )}
        {lastLocation && (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={handleViewOnMap}>
            <Text style={styles.mapButtonText}>View on Map</Text>
          </TouchableOpacity>
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
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
  },
  coordinate: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  mapButton: {
    backgroundColor: '#4a90d9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 16,
  },
  mapButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FriendProfileScreen;
