import React, {useEffect, useState} from 'react';
import {StyleSheet, View, Text, ActivityIndicator} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import {subscribeToLocation} from '../services/LocationService';
import type {Location} from '../services/LocationService';

type FriendMarker = {
  lat: number;
  lng: number;
  displayName: string;
};

type MapScreenProps = {
  route?: {
    params?: {
      friendMarker?: FriendMarker;
    };
  };
};

function MapScreen({route}: MapScreenProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const friendMarker = route?.params?.friendMarker ?? null;

  useEffect(() => {
    const unsubscribe = subscribeToLocation(loc => {
      setLocation(loc);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!location) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading location...</Text>
      </View>
    );
  }

  const region = friendMarker
    ? {
        latitude: friendMarker.lat,
        longitude: friendMarker.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title="You"
          description="Your current location"
        />
        {friendMarker && (
          <Marker
            coordinate={{
              latitude: friendMarker.lat,
              longitude: friendMarker.lng,
            }}
            title={friendMarker.displayName}
            description={`${friendMarker.displayName}'s last known location`}
            pinColor="blue"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MapScreen;
