import Geolocation, { GeolocationResponse } from '@react-native-community/geolocation';
import {
    PermissionsAndroid, Platform
} from 'react-native';

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface SafeLocation {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    createdAt: number;
}

class LocationService {
    private watchId: number | null = null;

    /**
     * Request location permission
     */
    async requestLocationPermission(): Promise<boolean> {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                ]);

                return (
                    granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
                    granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
                );
            } catch (err) {
                console.error('Error requesting location permission:', err);
                return false;
            }
        }
        return true; // iOS handles permissions differently
    }

    /**
     * Get current location
     */
    getCurrentLocation(): Promise<Coordinates> {
        return new Promise((resolve, reject) => {
            // Try high accuracy first
            const highAccuracyOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000,
            };

            const successHandler = (position: GeolocationResponse) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            };

            const errorHandler = (error: any) => {
                console.log('Location error (High Accuracy):', error);

                // If high accuracy fails, try low accuracy (network/wifi)
                console.log('Attempting low accuracy fallback...');
                Geolocation.getCurrentPosition(
                    successHandler,
                    (finalError) => {
                        console.error('Final location error:', finalError);
                        reject(finalError);
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 15000,
                        maximumAge: 10000,
                    }
                );
            };

            Geolocation.getCurrentPosition(
                successHandler,
                errorHandler,
                highAccuracyOptions
            );
        });
    }

    /**
     * Start watching location changes
     */
    startWatchingLocation(onLocationChange: (coords: Coordinates) => void): void {
        this.watchId = Geolocation.watchPosition(
            (position: GeolocationResponse) => {
                onLocationChange({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                console.error('Error watching location:', error);
            },
            {
                enableHighAccuracy: false, // Use network/wifi for better indoor performance
                distanceFilter: 10, // Update every 10 meters
                interval: 5000, // Update every 5 seconds
                fastestInterval: 2000,
            }
        );
    }

    /**
     * Stop watching location
     */
    stopWatchingLocation(): void {
        if (this.watchId !== null) {
            Geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in meters
     */
    calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371000; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lng2 - lng1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    /**
     * Check if current location is inside any safe zone (within 100m radius)
     */
    isInsideSafeZone(currentLat: number, currentLng: number, safeLocations: SafeLocation[]): SafeLocation | null {
        const SAFE_ZONE_RADIUS = 100; // 100 meters

        for (const location of safeLocations) {
            const distance = this.calculateDistance(
                currentLat,
                currentLng,
                location.latitude,
                location.longitude
            );

            if (distance <= SAFE_ZONE_RADIUS) {
                return location;
            }
        }

        return null;
    }

    /**
     * Generate a unique ID for safe locations
     */
    generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

export default new LocationService();
