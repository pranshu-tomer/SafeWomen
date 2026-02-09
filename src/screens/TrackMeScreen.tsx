import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    StatusBar,
    ScrollView,
    Share,
    Platform,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import LocationService, { SafeLocation, Coordinates } from '../services/LocationService';
import { StorageService } from '../services/StorageService';

const TrackMeScreen = () => {
    const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
    const [safeLocations, setSafeLocations] = useState<SafeLocation[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [shareDuration, setShareDuration] = useState('');
    const [locationName, setLocationName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Load current location and safe locations
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Request permission and get current location
            const hasPermission = await LocationService.requestLocationPermission();
            if (hasPermission) {
                const location = await LocationService.getCurrentLocation();
                setCurrentLocation(location);
            } else {
                Alert.alert('Permission Denied', 'Location permission is required for this feature.');
            }

            // Load safe locations
            const locations = await StorageService.getSafeLocations();
            setSafeLocations(locations);
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to get current location');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShareLocation = async () => {
        if (!currentLocation) {
            Alert.alert('Error', 'Location not available');
            return;
        }

        const duration = parseInt(shareDuration, 10);
        if (isNaN(duration) || duration <= 0) {
            Alert.alert('Invalid Duration', 'Please enter a valid duration in minutes');
            return;
        }

        // Create shareable link (in real app, this would use a backend)
        const shareMessage = `🚨 Safety Alert!\n\nI'm sharing my live location for ${duration} minutes.\n\nCurrent Location:\nhttps://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}\n\nSent from Safety Companion App`;

        try {
            await Share.share({
                message: shareMessage,
                title: 'Share My Location',
            });
            setShowShareModal(false);
            setShareDuration('');
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleMarkSafeLocation = async () => {
        if (!currentLocation) {
            Alert.alert('Error', 'Location not available');
            return;
        }

        if (!locationName.trim()) {
            Alert.alert('Error', 'Please enter a name for this location');
            return;
        }

        const newLocation: SafeLocation = {
            id: LocationService.generateId(),
            name: locationName.trim(),
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            createdAt: Date.now(),
        };

        try {
            await StorageService.addSafeLocation(newLocation);
            setSafeLocations([...safeLocations, newLocation]);
            setShowSaveModal(false);
            setLocationName('');
            Alert.alert('Success', `"${newLocation.name}" has been marked as a safe location`);
        } catch (error) {
            console.error('Error saving location:', error);
            Alert.alert('Error', 'Failed to save safe location');
        }
    };

    const handleDeleteSafeLocation = async (id: string, name: string) => {
        Alert.alert(
            'Delete Safe Location',
            `Are you sure you want to delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await StorageService.deleteSafeLocation(id);
                        setSafeLocations(safeLocations.filter(loc => loc.id !== id));
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Track Me</Text>
                    <Text style={styles.subtitle}>Your Location & Safety Zones</Text>
                </View>

                {/* Map */}
                <View style={styles.mapContainer}>
                    {currentLocation ? (
                        <MapView
                            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                            style={styles.map}
                            initialRegion={{
                                latitude: currentLocation.latitude,
                                longitude: currentLocation.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                            showsUserLocation
                            showsMyLocationButton
                        >
                            {/* Current location marker */}
                            <Marker
                                coordinate={currentLocation}
                                title="You are here"
                                pinColor="#7C3AED"
                            />

                            {/* Safe location markers and circles */}
                            {safeLocations.map(location => (
                                <React.Fragment key={location.id}>
                                    <Marker
                                        coordinate={{
                                            latitude: location.latitude,
                                            longitude: location.longitude,
                                        }}
                                        title={location.name}
                                        description="Safe Zone (100m radius)"
                                        pinColor="#10B981"
                                    />
                                    <Circle
                                        center={{
                                            latitude: location.latitude,
                                            longitude: location.longitude,
                                        }}
                                        radius={100}
                                        fillColor="rgba(16, 185, 129, 0.2)"
                                        strokeColor="#10B981"
                                        strokeWidth={2}
                                    />
                                </React.Fragment>
                            ))}
                        </MapView>
                    ) : (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>
                                {isLoading ? 'Loading map...' : 'Location unavailable'}
                            </Text>
                            {!isLoading && !currentLocation && (
                                <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                                    <Text style={styles.retryText}>Retry</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setShowShareModal(true)}
                    >
                        <Text style={styles.actionIcon}>📤</Text>
                        <Text style={styles.actionText}>Share My Location</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.safeButton]}
                        onPress={() => setShowSaveModal(true)}
                    >
                        <Text style={styles.actionIcon}>📍</Text>
                        <Text style={styles.actionText}>Mark as Safe Location</Text>
                    </TouchableOpacity>
                </View>

                {/* Safe Locations List */}
                {safeLocations.length > 0 && (
                    <View style={styles.safeLocationsCard}>
                        <Text style={styles.cardTitle}>Saved Safe Locations</Text>
                        <ScrollView style={styles.locationsList}>
                            {safeLocations.map(location => (
                                <View key={location.id} style={styles.locationItem}>
                                    <View style={styles.locationInfo}>
                                        <Text style={styles.locationName}>{location.name}</Text>
                                        <Text style={styles.locationCoords}>
                                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteSafeLocation(location.id, location.name)}
                                        style={styles.deleteButton}
                                    >
                                        <Text style={styles.deleteText}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Share Location Modal */}
                <Modal
                    visible={showShareModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowShareModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Share My Location</Text>
                            <Text style={styles.modalSubtitle}>
                                Enter duration to share your live location
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Duration in minutes"
                                keyboardType="numeric"
                                value={shareDuration}
                                onChangeText={setShareDuration}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setShowShareModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={handleShareLocation}
                                >
                                    <Text style={styles.confirmButtonText}>Share</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Save Safe Location Modal */}
                <Modal
                    visible={showSaveModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowSaveModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Mark Safe Location</Text>
                            <Text style={styles.modalSubtitle}>
                                Give this location a name (e.g., "Home", "Office")
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Location name"
                                value={locationName}
                                onChangeText={setLocationName}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setShowSaveModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.confirmButton, styles.saveConfirmButton]}
                                    onPress={handleMarkSafeLocation}
                                >
                                    <Text style={styles.confirmButtonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    mapContainer: {
        height: 300,
        marginHorizontal: 20,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#E5E7EB',
    },
    map: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
    },
    actionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#7C3AED',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    safeButton: {
        backgroundColor: '#10B981',
    },
    actionIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    safeLocationsCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 16,
        padding: 16,
        maxHeight: 200,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    locationsList: {
        flex: 1,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    locationInfo: {
        flex: 1,
    },
    locationName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    locationCoords: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    deleteButton: {
        padding: 8,
    },
    deleteText: {
        fontSize: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '85%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    confirmButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
    },
    saveConfirmButton: {
        backgroundColor: '#10B981',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    retryButton: {
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#7C3AED',
        borderRadius: 8,
    },
    retryText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});

export default TrackMeScreen;
