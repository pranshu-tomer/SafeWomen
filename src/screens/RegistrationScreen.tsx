import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, StatusBar } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type RegistrationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Registration'>;

const RegistrationScreen = () => {
    const navigation = useNavigation<RegistrationScreenNavigationProp>();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [preference, setPreference] = useState<'call' | 'sms' | 'both'>('both');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!phoneNumber) {
            Alert.alert('Error', 'Please enter an emergency number');
            return;
        }
        setLoading(true);
        try {
            // Using localhost with adb reverse (works on device & emulator)
            const response = await axios.post('http://localhost:5000/contacts', {
                contacts: [phoneNumber],
                preference
            }, { timeout: 5000 }); // 5s timeout
            console.log("Save response:", response.status);
            navigation.replace('MainTabs');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save contacts');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f0f2f5" />

            <View style={styles.header}>
                <Text style={styles.logoText}>SafeGuardHer</Text>
                <Text style={styles.subtitle}>Women Safety Companion</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Emergency Setup</Text>
                <Text style={styles.label}>Emergency Phone Number</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter phone number (e.g. +1234567890)"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholderTextColor="#999"
                />

                <Text style={styles.label}>Alert Preference</Text>
                <View style={styles.prefContainer}>
                    {['call', 'sms', 'both'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.prefButton,
                                preference === type && styles.prefButtonActive
                            ]}
                            onPress={() => setPreference(type as any)}
                        >
                            <Text style={[
                                styles.prefButtonText,
                                preference === type && styles.prefButtonTextActive
                            ]}>
                                {type.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.saveButtonText}>
                        {loading ? "Saving..." : "Save & Continue"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
        justifyContent: 'center',
        padding: 20
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ff4081', // Pinkish Red
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 25,
        color: '#333',
        textAlign: 'center'
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '600'
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#eee',
        padding: 15,
        marginBottom: 20,
        borderRadius: 12,
        fontSize: 16,
        color: '#333'
    },
    prefContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30
    },
    prefButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
        marginHorizontal: 5,
    },
    prefButtonActive: {
        backgroundColor: '#ff4081',
    },
    prefButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    },
    prefButtonTextActive: {
        color: 'white',
    },
    saveButton: {
        backgroundColor: '#ff4081',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#ff4081",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        backgroundColor: '#ff80ab',
        opacity: 0.7
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    }
});

export default RegistrationScreen;
