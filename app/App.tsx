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
import {ThemeProvider} from '@shopify/restyle';
import {theme} from './src/theme';
import LaunchScreen from './src/screens/LaunchScreen';
import LoginScreen from './src/screens/LoginScreen';
import MapScreen from './src/screens/MapScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import {
  PeopleScreen,
  GroupsScreen,
  PersonDetailScreen,
  GroupDetailScreen,
  CreateGroupScreen,
  EditGroupScreen,
  FindPeopleScreen,
  SharingRulesOverviewScreen,
} from './src/screens/social';
import {isAuthenticated, signOut} from './src/services/AuthService';

const Tab = createBottomTabNavigator();
const PeopleStack = createNativeStackNavigator();
const GroupsStack = createNativeStackNavigator();

const linking = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      Map: 'map',
      People: 'people',
      Groups: 'groups',
      Profile: 'profile',
    },
  },
};

function PeopleStackScreen() {
  return (
    <PeopleStack.Navigator>
      <PeopleStack.Screen
        name="PeopleHome"
        component={PeopleScreen}
        options={{headerShown: false}}
      />
      <PeopleStack.Screen
        name="PersonDetail"
        component={PersonDetailScreen}
        options={{title: 'Person'}}
      />
      <PeopleStack.Screen
        name="FindPeople"
        component={FindPeopleScreen}
        options={{title: 'Find People'}}
      />
    </PeopleStack.Navigator>
  );
}

function GroupsStackScreen() {
  return (
    <GroupsStack.Navigator>
      <GroupsStack.Screen
        name="GroupsHome"
        component={GroupsScreen}
        options={{headerShown: false}}
      />
      <GroupsStack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{title: 'Group'}}
      />
      <GroupsStack.Screen
        name="PersonDetail"
        component={PersonDetailScreen}
        options={{title: 'Person'}}
      />
      <GroupsStack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{title: 'Create Group'}}
      />
      <GroupsStack.Screen
        name="EditGroup"
        component={EditGroupScreen}
        options={{title: 'Edit Group'}}
      />
    </GroupsStack.Navigator>
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
      <ThemeProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <LaunchScreen onReady={handleReady} />
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  if (!authChecked) {
    return (
      <ThemeProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <LaunchScreen onReady={() => {}} />
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  if (!isLoggedIn) {
    return (
      <ThemeProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NavigationContainer linking={linking}>
          <Tab.Navigator
            initialRouteName="Map"
            screenOptions={({route}) => ({
              tabBarIcon: ({color, size}) => {
                let iconName = 'map-outline';
                if (route.name === 'Map') {
                  iconName = 'map-outline';
                } else if (route.name === 'People') {
                  iconName = 'person-outline';
                } else if (route.name === 'Groups') {
                  iconName = 'people-outline';
                } else if (route.name === 'Sharing') {
                  iconName = 'location-outline';
                } else if (route.name === 'Profile') {
                  iconName = 'settings-outline';
                }
                return <Ionicons name={iconName} size={size} color={color} />;
              },
            })}>
            <Tab.Screen
              name="People"
              component={PeopleStackScreen}
              options={{headerShown: false}}
            />
            <Tab.Screen
              name="Groups"
              component={GroupsStackScreen}
              options={{headerShown: false}}
            />
            <Tab.Screen name="Map" component={MapScreen} options={{headerShown: false}} />
            <Tab.Screen
              name="Sharing"
              component={SharingRulesOverviewScreen}
              options={{headerShown: false}}
            />
            <Tab.Screen name="Profile" options={{headerShown: false}}>
              {() => <ProfileScreen onSignOut={handleSignOut} />}
            </Tab.Screen>
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default App;
