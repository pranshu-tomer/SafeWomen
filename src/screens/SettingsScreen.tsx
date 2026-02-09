import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StorageService, FeatureSettings, DEFAULT_FEATURE_SETTINGS } from '../services/StorageService';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen = () => {
    const navigation = useNavigation<SettingsScreenNavigationProp>();
    const [features, setFeatures] = useState<FeatureSettings>(DEFAULT_FEATURE_SETTINGS);

    // Load saved feature settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            const savedSettings = await StorageService.getFeatureSettings();
            setFeatures(savedSettings);
        };
        loadSettings();
    }, []);

    const toggleFeature = async (feature: keyof FeatureSettings) => {
        const newSettings = { ...features, [feature]: !features[feature] };
        setFeatures(newSettings);
        // Save to storage
        await StorageService.saveFeatureSettings(newSettings);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Security Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>🔒</Text>
                        <Text style={styles.sectionTitle}>Security</Text>
                    </View>

                    <MenuItem
                        title="Change Password"
                        onPress={() => { }}
                    />
                    <MenuItem
                        title="Recalibrate Voice"
                        onPress={() => { }}
                    />
                </View>

                {/* Safety Features Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>🛡️</Text>
                        <Text style={styles.sectionTitle}>Safety Features</Text>
                    </View>

                    <FeatureToggle
                        icon="🎤"
                        title="Voice Detection"
                        subtitle="AI monitors your voice for distress"
                        isOn={features.voiceDetection}
                        onToggle={() => toggleFeature('voiceDetection')}
                    />
                    <FeatureToggle
                        icon="⚪"
                        title="Power Button (5x)"
                        subtitle="Press power button 5 times for instant alert"
                        badge="Recommended"
                        isOn={features.powerButton}
                        onToggle={() => toggleFeature('powerButton')}
                    />
                    <FeatureToggle
                        icon="🏃"
                        title="Running Detection"
                        subtitle="Detects if you're running (being chased)"
                        isOn={features.runningDetection}
                        onToggle={() => toggleFeature('runningDetection')}
                    />
                    <FeatureToggle
                        icon="💥"
                        title="Throw Detection"
                        subtitle="Alerts if phone is thrown or dropped hard"
                        isOn={features.throwDetection}
                        onToggle={() => toggleFeature('throwDetection')}
                    />
                    <FeatureToggle
                        icon="📍"
                        title="Safe Location"
                        subtitle="Disable monitoring at safe places"
                        isOn={features.safeLocation}
                        onToggle={() => toggleFeature('safeLocation')}
                    />
                    <FeatureToggle
                        icon="📱"
                        title="Switch Off Protection"
                        subtitle="Requires password to turn off phone"
                        isOn={features.switchOffProtection}
                        onToggle={() => toggleFeature('switchOffProtection')}
                    />
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

interface FeatureToggleProps {
    icon: string;
    title: string;
    subtitle: string;
    badge?: string;
    isOn: boolean;
    onToggle: () => void;
}

const FeatureToggle: React.FC<FeatureToggleProps> = ({ icon, title, subtitle, badge, isOn, onToggle }) => (
    <View style={styles.featureToggle}>
        <View style={styles.featureLeft}>
            <Text style={styles.featureIcon}>{icon}</Text>
            <View style={styles.featureInfo}>
                <View style={styles.featureTitleRow}>
                    <Text style={styles.featureTitle}>{title}</Text>
                    {badge && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{badge}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.featureSubtitle}>{subtitle}</Text>
            </View>
        </View>
        <TouchableOpacity
            style={[styles.toggleSwitch, isOn && styles.toggleSwitchOn]}
            onPress={onToggle}
            activeOpacity={0.8}
        >
            <View style={[styles.toggleThumb, isOn && styles.toggleThumbOn]} />
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        backgroundColor: '#7C3AED',
        paddingTop: 12,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
    },
    backIcon: {
        fontSize: 24,
        color: '#FFFFFF',
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginLeft: 8,
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
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
    menuItemText: {
        fontSize: 16,
        color: '#111827',
    },
    menuItemArrow: {
        fontSize: 24,
        color: '#9CA3AF',
    },
    featureToggle: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    featureLeft: {
        flexDirection: 'row',
        flex: 1,
        marginRight: 12,
    },
    featureIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    featureInfo: {
        flex: 1,
    },
    featureTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginRight: 8,
    },
    badge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#059669',
    },
    featureSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    toggleSwitch: {
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#D1D5DB',
        justifyContent: 'center',
        padding: 2,
    },
    toggleSwitchOn: {
        backgroundColor: '#7C3AED',
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleThumbOn: {
        alignSelf: 'flex-end',
    },
});

export default SettingsScreen;
