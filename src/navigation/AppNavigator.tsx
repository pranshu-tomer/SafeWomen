import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RegistrationScreen from '../screens/RegistrationScreen';
import HomeScreen from '../screens/HomeScreen';
import TrackMeScreen from '../screens/TrackMeScreen';
import ThreatScreen from '../screens/ThreatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';

export type RootStackParamList = {
    Registration: undefined;
    Home: undefined;
    TrackMe: undefined;
    Threat: { details?: string };
    Settings: undefined;
    EmergencyContacts: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Registration">
                <Stack.Screen
                    name="Registration"
                    component={RegistrationScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="TrackMe"
                    component={TrackMeScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="EmergencyContacts"
                    component={EmergencyContactsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Threat"
                    component={ThreatScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};



export default AppNavigator;
