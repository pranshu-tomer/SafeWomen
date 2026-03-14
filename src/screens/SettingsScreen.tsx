import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    StatusBar, Modal, TextInput, Alert, Switch,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StorageService } from '../services/StorageService';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen = () => {
    const navigation = useNavigation<SettingsScreenNavigationProp>();

    // Shake detection toggle
    const [shakeEnabled, setShakeEnabled] = useState(false);
    // Voice analysis toggle
    const [voiceEnabled, setVoiceEnabled] = useState(false);

    // Load settings whenever screen comes into focus
    useFocusEffect(
        useCallback(() => {
            StorageService.getFeatureSettings().then(s => {
                setShakeEnabled(s.shakeDetection);
                setVoiceEnabled(s.voiceDetection);
            });
        }, [])
    );

    const toggleShakeDetection = async (value: boolean) => {
        setShakeEnabled(value);
        const current = await StorageService.getFeatureSettings();
        await StorageService.saveFeatureSettings({ ...current, shakeDetection: value });
    };

    const toggleVoiceAnalysis = async (value: boolean) => {
        setVoiceEnabled(value);
        const current = await StorageService.getFeatureSettings();
        await StorageService.saveFeatureSettings({ ...current, voiceDetection: value });
    };

    // Change Password modal state
    const [pwModalVisible, setPwModalVisible] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const openChangePassword = () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPwModalVisible(true);
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Missing Fields', 'Please fill in all fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Mismatch', 'New passwords do not match.');
            return;
        }
        if (newPassword.length < 4) {
            Alert.alert('Too Short', 'Password must be at least 4 characters.');
            return;
        }

        const master = await StorageService.getMasterPassword();
        if (oldPassword !== master) {
            Alert.alert('Incorrect Password', 'The current password you entered is wrong.');
            return;
        }

        await StorageService.saveMasterPassword(newPassword);
        setPwModalVisible(false);
        Alert.alert('Success', 'Password changed successfully!');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Features Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>✨</Text>
                        <Text style={styles.sectionTitle}>Features</Text>
                    </View>

                    {/* Voice Analysis */}
                    <View style={styles.switchItem}>
                        <View style={styles.switchItemLeft}>
                            <Text style={styles.switchItemTitle}>Voice Analysis</Text>
                            <Text style={styles.switchItemDesc}>
                                Listen for distress sounds to trigger SOS
                            </Text>
                        </View>
                        <Switch
                            value={voiceEnabled}
                            onValueChange={toggleVoiceAnalysis}
                            trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    {/* Shake Detection */}
                    <View style={styles.switchItem}>
                        <View style={styles.switchItemLeft}>
                            <Text style={styles.switchItemTitle}>Shake Detection</Text>
                            <Text style={styles.switchItemDesc}>
                                Shake phone to instantly trigger SOS
                            </Text>
                        </View>
                        <Switch
                            value={shakeEnabled}
                            onValueChange={toggleShakeDetection}
                            trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>🔒</Text>
                        <Text style={styles.sectionTitle}>Security</Text>
                    </View>
                    <MenuItem title="Change Password" onPress={openChangePassword} />
                </View>

                {/* Emergency Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>📞</Text>
                        <Text style={styles.sectionTitle}>Emergency</Text>
                    </View>
                    <MenuItem
                        title="Emergency Contacts"
                        onPress={() => navigation.navigate('EmergencyContacts')}
                    />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── Change Password Modal ──────────────────────────────────── */}
            <Modal
                animationType="slide"
                transparent
                visible={pwModalVisible}
                onRequestClose={() => setPwModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Change Password</Text>
                        <Text style={styles.modalSubtitle}>
                            This is the password used to cancel a threat alert.
                        </Text>

                        <Text style={styles.inputLabel}>Current Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter current password"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry
                            keyboardType="numeric"
                            value={oldPassword}
                            onChangeText={setOldPassword}
                        />

                        <Text style={styles.inputLabel}>New Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter new password"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry
                            keyboardType="numeric"
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />

                        <Text style={styles.inputLabel}>Confirm New Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Re-enter new password"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry
                            keyboardType="numeric"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setPwModalVisible(false)}
                            >
                                <Text style={styles.modalBtnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnSave]}
                                onPress={handleChangePassword}
                            >
                                <Text style={styles.modalBtnSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

interface MenuItemProps {
    title: string;
    onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ title, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <Text style={styles.menuItemText}>{title}</Text>
        <Text style={styles.menuItemArrow}>›</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        backgroundColor: '#7C3AED',
        paddingTop: 12,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: { padding: 8 },
    backIcon: { fontSize: 24, color: '#FFFFFF' },
    headerTitle: {
        flex: 1, fontSize: 20, fontWeight: 'bold',
        color: '#FFFFFF', marginLeft: 8,
    },
    headerSpacer: { width: 40 },
    content: { flex: 1 },
    section: { marginTop: 24 },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, marginBottom: 12,
    },
    sectionIcon: { fontSize: 18, marginRight: 8 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    menuItem: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 18,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuItemText: { fontSize: 16, color: '#111827' },
    menuItemArrow: { fontSize: 24, color: '#9CA3AF' },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 6,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 18,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: '#111827',
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalBtnCancel: { backgroundColor: '#F3F4F6' },
    modalBtnSave: { backgroundColor: '#7C3AED' },
    modalBtnCancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
    modalBtnSaveText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

    // Switch row
    switchItem: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    switchItemLeft: { flex: 1, marginRight: 12 },
    switchItemTitle: { fontSize: 16, color: '#111827', marginBottom: 3 },
    switchItemDesc: { fontSize: 12, color: '#9CA3AF', lineHeight: 17 },
});

export default SettingsScreen;
