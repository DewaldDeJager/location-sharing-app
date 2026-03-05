import React, {useEffect, useState} from 'react';
import {ActivityIndicator} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@shopify/restyle';
import {Screen, Text} from '../theme';
import type {Theme} from '../theme';
import DeviceService from '../services/DeviceService';

type Props = {
  onReady: () => void;
};

function LaunchScreen({onReady}: Props) {
  const [status, setStatus] = useState('Initializing device…');
  const theme = useTheme<Theme>();

  useEffect(() => {
    (async () => {
      try {
        await DeviceService.ensureDeviceId();
      } catch (e) {
        setStatus('Unable to initialize device ID');
      }

      onReady();
    })();
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
