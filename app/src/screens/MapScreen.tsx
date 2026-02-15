import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import MapView, {Marker, Region} from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
  const [region, setRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView>(null);
  const friendMarker = route?.params?.friendMarker ?? null;
  const initialRegionSet = useRef(false);
  const prevFriendMarkerRef = useRef<FriendMarker | null>(null);
  // When true, the map will follow the currently focused subject (me or friend)
  const [isFollowing, setIsFollowing] = useState<boolean>(true);
  const [focusTarget, setFocusTarget] = useState<'me' | 'friend' | null>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeToLocation(loc => {
      setLocation(loc);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!location) {
      return;
    }

    const friendMarkerChanged =
      friendMarker !== prevFriendMarkerRef.current &&
      (friendMarker?.lat !== prevFriendMarkerRef.current?.lat ||
        friendMarker?.lng !== prevFriendMarkerRef.current?.lng ||
        friendMarker?.displayName !== prevFriendMarkerRef.current?.displayName);

    // Initial focus or when navigating to a specific friend: start following that target
    if (!initialRegionSet.current || friendMarkerChanged) {
      initialRegionSet.current = true;
      prevFriendMarkerRef.current = friendMarker;
      const focusingFriend = !!friendMarker;
      setFocusTarget(focusingFriend ? 'friend' : 'me');
      setIsFollowing(true);
      const target = focusingFriend
        ? {latitude: friendMarker!.lat, longitude: friendMarker!.lng}
        : {latitude: location.latitude, longitude: location.longitude};
      const newRegion: Region = {
        ...target,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      if (mapRef.current) {
        isAnimatingRef.current = true;
        mapRef.current.animateToRegion(newRegion, 500);
      }
      return;
    }

    // While following "me", keep centering as my location updates
    if (isFollowing && focusTarget === 'me') {
      const myRegion: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: region?.latitudeDelta ?? 0.01,
        longitudeDelta: region?.longitudeDelta ?? 0.01,
      };
      setRegion(myRegion);
      if (mapRef.current) {
        isAnimatingRef.current = true;
        mapRef.current.animateToRegion(myRegion, 300);
      }
    }
  }, [location, friendMarker, isFollowing, focusTarget]);

  const handleMyLocation = () => {
    if (!location) {
      return;
    }
    setIsFollowing(true);
    setFocusTarget('me');
    const myRegion: Region = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: region?.latitudeDelta ?? 0.01,
      longitudeDelta: region?.longitudeDelta ?? 0.01,
    };
    if (mapRef.current) {
      isAnimatingRef.current = true;
      mapRef.current.animateToRegion(myRegion, 500);
    }
    setRegion(myRegion);
  };

  const handleRegionChangeComplete = useCallback(
    (reg: Region, details?: {isGesture?: boolean}) => {
      // Always update our region snapshot
      setRegion(reg);

      // If user interacted, stop following
      if (details?.isGesture) {
        setIsFollowing(false);
        // keep current focusTarget but not following; alternatively we could null it
        return;
      }

      // Ignore the callback that is a result of our own animateToRegion
      if (isAnimatingRef.current) {
        isAnimatingRef.current = false;
        return;
      }
    },
    [],
  );

  if (!location || !region) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPanDrag={() => {
          // Fallback for platforms where details.isGesture might not be provided
          setIsFollowing(false);
        }}>
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
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={handleMyLocation}
        accessibilityLabel="My Location"
        testID="my-location-button">
        <Ionicons name="navigate" size={24} color="#007AFF" />
      </TouchableOpacity>
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
  myLocationButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: '#ffffff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default MapScreen;
