import React, {useState} from 'react';
import {TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@shopify/restyle';
import {Screen, Box, Text} from '../theme';
import type {Theme} from '../theme';
import {signIn} from '../services/AuthService';
type Props = {
  onLoginSuccess: () => void;
};
function LoginScreen({onLoginSuccess}: Props) {
  const [loading, setLoading] = useState(false);
  const theme = useTheme<Theme>();
  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn();
      onLoginSuccess();
    } catch (error: any) {
      if (error?.message?.includes('User cancelled')) {
        // User dismissed the login screen – do nothing
      } else {
        Alert.alert(
          'Sign In Failed',
          'Unable to sign in. Please try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen
      justifyContent="center"
      alignItems="center"
      backgroundColor="white"
      paddingHorizontal="xxl">
      <Ionicons
        name="location"
        size={64}
        color={theme.colors.danger}
        style={{marginBottom: theme.spacing.l}}
      />
      <Text
        variant="title"
        fontSize={32}
        marginBottom="s">
        Location Sharing
      </Text>
      <Text
        variant="body"
        color="muted"
        textAlign="center"
        marginBottom="xxl">
        Sign in to share your location with friends
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary,
          paddingVertical: 14,
          paddingHorizontal: 48,
          borderRadius: theme.borderRadii.s,
          minWidth: 200,
          alignItems: 'center',
        }}
        onPress={handleSignIn}
        disabled={loading}
        testID="sign-in-button">
        {loading ? (
          <ActivityIndicator color={theme.colors.white} />
        ) : (
          <Text variant="button" fontSize={18}>Sign In</Text>
        )}
      </TouchableOpacity>
    </Screen>
  );
}
export default LoginScreen;
