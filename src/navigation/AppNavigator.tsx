import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import RegistrationScreen from '../screens/RegistrationScreen';
import HomeScreen from '../screens/HomeScreen';
import TrackMeScreen from '../screens/TrackMeScreen';
import ThreatScreen from '../screens/ThreatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';

export type RootStackParamList = {
    Registration: undefined;
    MainTabs: undefined;
    Home: undefined;
    TrackMe: undefined;
    Threat: { details?: string };
    Settings: undefined;
    EmergencyContacts: undefined;
};

export type TabParamList = {
    Home: undefined;
    TrackMe: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Custom Tab Icon Component
const TabIcon = ({ icon, focused }: { icon: string; focused: boolean }) => (
    <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
        <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
    </View>
);

// Bottom Tab Navigator
const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: true,
                tabBarLabelStyle: styles.tabLabel,
                tabBarActiveTintColor: '#7C3AED',
                tabBarInactiveTintColor: '#6B7280',
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
                }}
            />
            <Tab.Screen
                name="TrackMe"
                component={TrackMeScreen}
                options={{
                    tabBarLabel: 'Track Me',
                    tabBarIcon: ({ focused }) => <TabIcon icon="📍" focused={focused} />,
                }}
            />
        </Tab.Navigator>
    );
};

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
                    name="MainTabs"
                    component={MainTabNavigator}
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

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 8,
        paddingBottom: 8,
        height: 65,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    tabIconContainer: {
        padding: 4,
        borderRadius: 8,
    },
    tabIconContainerActive: {
        backgroundColor: '#F3E8FF',
    },
    tabIcon: {
        fontSize: 24,
    },
    tabIconActive: {
        transform: [{ scale: 1.1 }],
    },
});

export default AppNavigator;
