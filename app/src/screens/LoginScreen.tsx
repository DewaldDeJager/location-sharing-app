import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {signIn} from '../services/AuthService';

type Props = {
  onLoginSuccess: () => void;
};

function LoginScreen({onLoginSuccess}: Props) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn();
      onLoginSuccess();
    } catch (error: any) {
      if (error?.message?.includes('User cancelled')) {
        // User dismissed the login screen — do nothing
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
    <View style={styles.container}>
      <Ionicons
        name="location"
        size={64}
        color="#e74c3c"
        style={styles.logoIcon}
      />
      <Text style={styles.appName}>Location Sharing</Text>
      <Text style={styles.subtitle}>
        Sign in to share your location with friends
      </Text>

      <TouchableOpacity
        style={styles.signInButton}
        onPress={handleSignIn}
        disabled={loading}
        testID="sign-in-button">
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.signInButtonText}>Sign In</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
  },
  logoIcon: {
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  signInButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LoginScreen;
