import React, {useEffect, useState, useCallback} from 'react';
import {ScrollView, RefreshControl, ActivityIndicator} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@shopify/restyle';
import {Screen, Box, Text, Button} from '../theme';
import type {Theme} from '../theme';
import {getTokens, getUserSub, getUserEmail, getUserName} from '../services/AuthService';
import {fetchProfile} from '../services/ProfileService';
import type {ProfileResponse} from '../services/ProfileService';

type Props = {
  onSignOut: () => void;
};

function ProfileScreen({onSignOut}: Props) {
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();
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
    <Box flexDirection="row" marginBottom="s" width="100%" alignItems="flex-start">
      <Text variant="caption" style={{width: 85, fontWeight: 'bold'}}>{label}:</Text>
      <Text variant="body" style={{flex: 1, fontSize: 14}}>{value}</Text>
    </Box>
  );

  const header = (
    <Box
      paddingHorizontal="l"
      paddingVertical="m"
      style={{paddingTop: insets.top + theme.spacing.m}}>
      <Text variant="title">Profile</Text>
    </Box>
  );

  return (
    <Screen>
      {header}
      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: theme.spacing.l,
          paddingBottom: theme.spacing.xl,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Box
          backgroundColor="card"
          borderRadius="m"
          padding="xl"
          width="100%"
          alignItems="center"
          style={{
            shadowColor: theme.colors.black,
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
          <Text variant="title" marginBottom="m" style={{textAlign: 'center'}}>
            {userName ?? userEmail ?? 'User'}
          </Text>

          <Box width="100%" marginBottom="m">
            {userName && userEmail && (
              <DetailRow label="Email" value={userEmail} />
            )}
            {userSub && (
              <DetailRow label="User ID" value={userSub} />
            )}
            {profile?.deviceId && (
              <DetailRow label="Device ID" value={profile.deviceId} />
            )}
          </Box>

          <Box height={1} backgroundColor="border" width="100%" marginBottom="m" />

          <Text variant="subtitle" marginBottom="m">Current Location</Text>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : location ? (
            <Box width="100%">
              <DetailRow label="Latitude" value={location.latitude.toFixed(6)} />
              <DetailRow label="Longitude" value={location.longitude.toFixed(6)} />
              {location.formattedAddress && (
                <DetailRow label="Address" value={location.formattedAddress} />
              )}
              {location.timeZoneName && (
                <DetailRow label="Time Zone" value={location.timeZoneName} />
              )}
            </Box>
          ) : (
            <Text variant="caption" style={{fontStyle: 'italic'}}>No location data available</Text>
          )}
        </Box>

        <Box marginTop="xl" width="100%">
          <Button
            label="Sign Out"
            onPress={onSignOut}
            variant="danger"
          />
        </Box>
      </ScrollView>
    </Screen>
  );
}

export default ProfileScreen;
