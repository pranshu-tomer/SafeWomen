import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Animated,
    Dimensions,
} from 'react-native';
import AudioService from '../services/AudioService';
import ShakeService from '../services/ShakeService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StorageService, FeatureSettings, DEFAULT_FEATURE_SETTINGS } from '../services/StorageService';
import LocationService, { SafeLocation, Coordinates } from '../services/LocationService';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Pulse Ring Component ────────────────────────────────────────────────────
interface PulseRingProps {
    animValue: Animated.Value;
    size: number;
    color: string;
    delay: number;
    isActive: boolean;
}

const PulseRing: React.FC<PulseRingProps> = ({ animValue, size, color, delay, isActive }) => {
    const loopRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (isActive) {
            animValue.setValue(0);
            loopRef.current = Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(animValue, {
                        toValue: 1,
                        duration: 2400,
                        useNativeDriver: true,
                    }),
                ])
            );
            loopRef.current.start();
        } else {
            if (loopRef.current) loopRef.current.stop();
            animValue.setValue(0);
        }
        return () => {
            if (loopRef.current) loopRef.current.stop();
        };
    }, [isActive]);

    const scale = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.85, 1.0],
    });
    const opacity = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 0],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 1.5,
                borderColor: color,
                backgroundColor: color,
                opacity: isActive ? opacity : 0,
                transform: [{ scale: isActive ? scale : 1 }],
            }}
        />
    );
};

// ─── Audio Wave Bar ───────────────────────────────────────────────────────────
interface WaveBarProps {
    delay: number;
    isActive: boolean;
}

const WaveBar: React.FC<WaveBarProps> = ({ delay, isActive }) => {
    const animValue = useRef(new Animated.Value(0.3)).current;
    const loopRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (isActive) {
            loopRef.current = Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(animValue, { toValue: 1, duration: 350, useNativeDriver: true }),
                    Animated.timing(animValue, { toValue: 0.3, duration: 350, useNativeDriver: true }),
                ])
            );
            loopRef.current.start();
        } else {
            if (loopRef.current) loopRef.current.stop();
            animValue.setValue(0.3);
        }
        return () => { if (loopRef.current) loopRef.current.stop(); };
    }, [isActive]);

    return (
        <Animated.View
            style={{
                width: 4,
                height: 24,
                borderRadius: 2,
                backgroundColor: '#10B981',
                marginHorizontal: 3,
                transform: [{ scaleY: animValue }],
            }}
        />
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [features, setFeatures] = useState<FeatureSettings>(DEFAULT_FEATURE_SETTINGS);
    const [isInSafeZone, setIsInSafeZone] = useState(false);
    const [currentSafeZone, setCurrentSafeZone] = useState<string | null>(null);

    const originalFeaturesRef = useRef<FeatureSettings | null>(null);
    const safeLocationsRef = useRef<SafeLocation[]>([]);

    // Pulse ring animated values
    const ring1Anim = useRef(new Animated.Value(0)).current;
    const ring2Anim = useRef(new Animated.Value(0)).current;
    const ring3Anim = useRef(new Animated.Value(0)).current;

    // ── Load settings on focus ──────────────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            const loadSettings = async () => {
                const savedSettings = await StorageService.getFeatureSettings();
                setFeatures(savedSettings);
                const locations = await StorageService.getSafeLocations();
                safeLocationsRef.current = locations;
            };
            loadSettings();
        }, [])
    );

    // ── Safe zone location watcher ──────────────────────────────────────────
    useEffect(() => {
        if (isMonitoring && features.safeLocation) {
            LocationService.startWatchingLocation((coords: Coordinates) => {
                const safeZone = LocationService.isInsideSafeZone(
                    coords.latitude,
                    coords.longitude,
                    safeLocationsRef.current
                );
                if (safeZone && !isInSafeZone) {
                    console.log('📍 Entered safe zone:', safeZone.name);
                    setIsInSafeZone(true);
                    setCurrentSafeZone(safeZone.name);
                    originalFeaturesRef.current = { ...features };
                } else if (!safeZone && isInSafeZone) {
                    console.log('📍 Left safe zone');
                    setIsInSafeZone(false);
                    setCurrentSafeZone(null);
                    if (originalFeaturesRef.current) {
                        StorageService.saveFeatureSettings(originalFeaturesRef.current);
                        setFeatures(originalFeaturesRef.current);
                        originalFeaturesRef.current = null;
                    }
                }
            });
            return () => { LocationService.stopWatchingLocation(); };
        }
    }, [isMonitoring, features.safeLocation, isInSafeZone]);

    // ── Toggle monitoring ───────────────────────────────────────────────────
    const toggleMonitoring = () => {
        if (isMonitoring) {
            AudioService.stopMonitoring();
            LocationService.stopWatchingLocation();
            ShakeService.stop();
            setIsMonitoring(false);
            setIsInSafeZone(false);
            setCurrentSafeZone(null);
        } else {
            setIsMonitoring(true);

            // Start voice analysis only if enabled
            if (features.voiceDetection) {
                AudioService.startMonitoring((result) => {
                    if (result.threat && !isInSafeZone) {
                        setIsMonitoring(false);
                        ShakeService.stop();
                        navigation.navigate('Threat', { details: result.details });
                    }
                });
            }

            // Start shake detection only if enabled
            if (features.shakeDetection) {
                ShakeService.start(() => {
                    setIsMonitoring(false);
                    ShakeService.stop();
                    AudioService.stopMonitoring();
                    navigation.navigate('Threat', { details: 'Phone shaken — shake SOS triggered' });
                });
            }
        }
    };

    // ── Derived colors ──────────────────────────────────────────────────────
    const ringColor1 = isMonitoring ? 'rgba(52,211,153,0.20)' : 'rgba(239,68,68,0.15)';
    const ringColor2 = isMonitoring ? 'rgba(52,211,153,0.28)' : 'rgba(239,68,68,0.22)';
    const ringColor3 = isMonitoring ? 'rgba(52,211,153,0.35)' : 'rgba(239,68,68,0.30)';
    const glowColor = isMonitoring ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)';

    // ── Feature cards data ──────────────────────────────────────────────────
    const featureCards = [
        { emoji: '🎤', label: 'Voice', enabled: features.voiceDetection },
        { emoji: '📍', label: 'Location', enabled: features.safeLocation },
        { emoji: '📳', label: 'Shake SOS', enabled: features.shakeDetection },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D0D14" />

            {/* ── Header ─────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.appName}>Safety Companion</Text>
                    <Text style={styles.appSubtitle}>YOU'RE PROTECTED</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.secureBadge}>
                        <Text style={styles.secureDot}>●</Text>
                        <Text style={styles.secureText}> SECURE</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.settingsBtn}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Safe Zone Banner ───────────────────────────────────────── */}
            {isInSafeZone && (
                <View style={styles.safeZoneBanner}>
                    <Text style={styles.safeZoneText}>
                        📍 Safe Zone Active: {currentSafeZone}
                    </Text>
                    <Text style={styles.safeZoneSubtext}>
                        Monitoring paused while in this location
                    </Text>
                </View>
            )}

            {/* ── Center Area ────────────────────────────────────────────── */}
            <View style={styles.centerArea}>

                {/* Radial glow */}
                <View style={[styles.radialGlow, { backgroundColor: glowColor }]} />

                {/* Pulse rings */}
                <PulseRing animValue={ring1Anim} size={230} color={ringColor1} delay={0} isActive={isMonitoring} />
                <PulseRing animValue={ring2Anim} size={280} color={ringColor2} delay={500} isActive={isMonitoring} />
                <PulseRing animValue={ring3Anim} size={330} color={ringColor3} delay={1000} isActive={isMonitoring} />

                {/* Main button */}
                <TouchableOpacity
                    style={[styles.mainButton, isMonitoring ? styles.mainButtonActive : styles.mainButtonIdle]}
                    onPress={toggleMonitoring}
                    activeOpacity={0.85}
                >
                    <Text style={styles.mainButtonEmoji}>{isMonitoring ? '👂' : '🛡️'}</Text>
                    <Text style={styles.mainButtonLabel}>{isMonitoring ? 'STOP' : 'START'}</Text>
                </TouchableOpacity>
            </View>

            {/* ── Status Text ────────────────────────────────────────────── */}
            <View style={styles.statusTextArea}>
                <Text style={styles.statusTitle}>
                    {isMonitoring ? "We've got your back." : 'Stay Safe'}
                </Text>
                <Text style={styles.statusSubtitle}>
                    {isMonitoring ? 'Listening to surroundings...' : 'Tap to begin monitoring'}
                </Text>
                {isMonitoring && (
                    <View style={styles.waveContainer}>
                        {[0, 100, 200, 300, 400].map((d, i) => (
                            <WaveBar key={i} delay={d} isActive={isMonitoring} />
                        ))}
                    </View>
                )}
            </View>

            {/* ── Feature Cards ──────────────────────────────────────────── */}
            <View style={styles.featureRow}>
                {featureCards.map((card, i) => {
                    const isLocation = card.label === 'Location';
                    const CardWrapper = isLocation ? TouchableOpacity : View;
                    // Dot logic: grey when idle; green if feature ON, red if feature OFF while monitoring
                    const dotStyle = !isMonitoring
                        ? styles.featureDot
                        : card.enabled
                            ? [styles.featureDot, styles.featureDotActive]
                            : [styles.featureDot, styles.featureDotInactive];
                    return (
                        <CardWrapper
                            key={i}
                            style={styles.featureCard}
                            {...(isLocation ? { onPress: () => navigation.navigate('TrackMe'), activeOpacity: 0.75 } : {})}
                        >
                            <Text style={styles.featureEmoji}>{card.emoji}</Text>
                            <Text style={styles.featureLabel}>{card.label}</Text>
                            <View style={dotStyle} />
                        </CardWrapper>
                    );
                })}
            </View>

            {/* ── Bottom Bar ─────────────────────────────────────────────── */}
            <View style={styles.bottomBar}>
                <View style={styles.locationPill}>
                    <Text style={styles.locationText}>📍 Current City</Text>
                </View>
                <TouchableOpacity style={styles.sosPill}>
                    <Text style={styles.sosText}>🆘 SOS</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D14',
        paddingHorizontal: 20,
        paddingTop: 32,  // padding
        paddingBottom: 16,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 12,
    },
    appName: {
        fontSize: 22,
        fontFamily: 'Georgia',
        fontWeight: '700',
        color: '#F3F4F6',
        letterSpacing: 0.5,
    },
    appSubtitle: {
        fontSize: 10,
        color: '#6B7280',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    secureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16,185,129,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.30)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    secureDot: {
        fontSize: 8,
        color: '#10B981',
    },
    secureText: {
        fontSize: 10,
        color: '#10B981',
        fontWeight: '700',
        letterSpacing: 1,
    },
    settingsBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsIcon: {
        fontSize: 18,
    },

    // Safe Zone Banner
    safeZoneBanner: {
        backgroundColor: 'rgba(16,185,129,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.35)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        alignItems: 'center',
    },
    safeZoneText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10B981',
        marginBottom: 3,
    },
    safeZoneSubtext: {
        fontSize: 12,
        color: '#6EE7B7',
    },

    // Center area with button + rings
    centerArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radialGlow: {
        position: 'absolute',
        width: 360,
        height: 360,
        borderRadius: 180,
    },
    mainButton: {
        width: 130,
        height: 130,
        borderRadius: 65,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 12,
    },
    mainButtonIdle: {
        backgroundColor: '#7f1d1d',
        shadowColor: '#EF4444',
        // Simulate gradient with a second layer (RN doesn't support linear gradient natively)
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    mainButtonActive: {
        backgroundColor: '#064e3b',
        shadowColor: '#10B981',
        borderWidth: 1,
        borderColor: '#10B981',
    },
    mainButtonEmoji: {
        fontSize: 36,
        marginBottom: 4,
    },
    mainButtonLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 3,
    },

    // Status text
    statusTextArea: {
        alignItems: 'center',
        marginBottom: 24,
        minHeight: 80,
    },
    statusTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#F3F4F6',
        fontFamily: 'Georgia',
        marginBottom: 6,
    },
    statusSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        letterSpacing: 0.3,
    },
    waveContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },

    // Feature cards
    featureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    featureCard: {
        flex: 1,
        marginHorizontal: 4,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 6,
        alignItems: 'center',
    },
    featureEmoji: {
        fontSize: 22,
        marginBottom: 6,
    },
    featureLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 10,
        textAlign: 'center',
    },
    featureDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#374151',
    },
    featureDotActive: {
        backgroundColor: '#10B981',
    },
    featureDotInactive: {
        backgroundColor: '#EF4444',
    },

    // Bottom bar
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationPill: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    locationText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    sosPill: {
        backgroundColor: 'rgba(239,68,68,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.35)',
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 8,
    },
    sosText: {
        fontSize: 13,
        color: '#EF4444',
        fontWeight: '700',
        letterSpacing: 1,
    },
});

export default HomeScreen;
