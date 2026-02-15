/**
 * Location Sharing App
 *
 * @format
 */

import React, {useState, useCallback, useEffect} from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LaunchScreen from './src/screens/LaunchScreen';
import LoginScreen from './src/screens/LoginScreen';
import MapScreen from './src/screens/MapScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import FriendProfileScreen from './src/screens/FriendProfileScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import {isAuthenticated, signOut} from './src/services/AuthService';

const Tab = createBottomTabNavigator();
const FriendsStack = createNativeStackNavigator();

const linking = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      Map: 'map',
      Friends: 'friends',
      Profile: 'profile',
    },
  },
};

function FriendsStackScreen() {
  return (
    <FriendsStack.Navigator>
      <FriendsStack.Screen
        name="FriendsList"
        component={FriendsScreen}
        options={{title: 'Friends'}}
      />
      <FriendsStack.Screen
        name="FriendProfile"
        component={FriendProfileScreen}
        options={({route}: {route: any}) => ({
          title: route.params?.displayName ?? 'Friend Profile',
        })}
      />
    </FriendsStack.Navigator>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const handleReady = useCallback(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    (async () => {
      const authenticated = await isAuthenticated();
      setIsLoggedIn(authenticated);
      setAuthChecked(true);
    })();
  }, [isReady]);

  const handleLoginSuccess = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setIsLoggedIn(false);
  }, []);

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <LaunchScreen onReady={handleReady} />
      </SafeAreaProvider>
    );
  }

  if (!authChecked) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <LaunchScreen onReady={() => {}} />
      </SafeAreaProvider>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer linking={linking}>
        <Tab.Navigator
          screenOptions={({route}) => ({
            tabBarIcon: ({color, size}) => {
              let iconName = 'map-outline';
              if (route.name === 'Map') {
                iconName = 'map-outline';
              } else if (route.name === 'Friends') {
                iconName = 'people-outline';
              } else if (route.name === 'Profile') {
                iconName = 'person-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}>
          <Tab.Screen name="Map" component={MapScreen} />
          <Tab.Screen
            name="Friends"
            component={FriendsStackScreen}
            options={{headerShown: false}}
          />
          <Tab.Screen name="Profile">
            {() => <ProfileScreen onSignOut={handleSignOut} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
