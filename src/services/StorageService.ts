import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeLocation } from './LocationService';

const CALL_CONTACT_KEY = '@emergency_call_contact';
const SMS_CONTACTS_KEY = '@emergency_sms_contacts';
const FEATURES_KEY = '@feature_settings';
const SAFE_LOCATIONS_KEY = '@safe_locations';
const MASTER_PASSWORD_KEY = '@master_password';

export interface EmergencyContacts {
    callContact: string | null;
    smsContacts: string[];
}

export interface FeatureSettings {
    voiceDetection: boolean;
    powerButton: boolean;
    runningDetection: boolean;
    throwDetection: boolean;
    safeLocation: boolean;
    switchOffProtection: boolean;
}

// Default feature settings - all features are OFF by default
export const DEFAULT_FEATURE_SETTINGS: FeatureSettings = {
    voiceDetection: false,
    powerButton: false,
    runningDetection: false,
    throwDetection: false,
    safeLocation: false,
    switchOffProtection: false,
};

export class StorageService {
    /**
     * Save the call contact (only one allowed)
     */
    static async saveCallContact(phoneNumber: string): Promise<void> {
        try {
            await AsyncStorage.setItem(CALL_CONTACT_KEY, phoneNumber);
        } catch (error) {
            console.error('Error saving call contact:', error);
            throw error;
        }
    }

    /**
     * Save SMS contacts (multiple allowed)
     */
    static async saveSMSContacts(phoneNumbers: string[]): Promise<void> {
        try {
            await AsyncStorage.setItem(SMS_CONTACTS_KEY, JSON.stringify(phoneNumbers));
        } catch (error) {
            console.error('Error saving SMS contacts:', error);
            throw error;
        }
    }

    /**
     * Save both call and SMS contacts together
     */
    static async saveContacts(callContact: string, smsContacts: string[]): Promise<void> {
        await Promise.all([
            this.saveCallContact(callContact),
            this.saveSMSContacts(smsContacts),
        ]);
    }

    /**
     * Get the call contact
     */
    static async getCallContact(): Promise<string | null> {
        try {
            const contact = await AsyncStorage.getItem(CALL_CONTACT_KEY);
            return contact;
        } catch (error) {
            console.error('Error getting call contact:', error);
            return null;
        }
    }

    /**
     * Get SMS contacts
     */
    static async getSMSContacts(): Promise<string[]> {
        try {
            const contacts = await AsyncStorage.getItem(SMS_CONTACTS_KEY);
            return contacts ? JSON.parse(contacts) : [];
        } catch (error) {
            console.error('Error getting SMS contacts:', error);
            return [];
        }
    }

    /**
     * Get all emergency contacts
     */
    static async getAllContacts(): Promise<EmergencyContacts> {
        const [callContact, smsContacts] = await Promise.all([
            this.getCallContact(),
            this.getSMSContacts(),
        ]);
        return { callContact, smsContacts };
    }

    /**
     * Clear all emergency contacts
     */
    static async clearAllContacts(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([CALL_CONTACT_KEY, SMS_CONTACTS_KEY]);
        } catch (error) {
            console.error('Error clearing contacts:', error);
            throw error;
        }
    }

    /**
     * Save feature settings
     */
    static async saveFeatureSettings(settings: FeatureSettings): Promise<void> {
        try {
            await AsyncStorage.setItem(FEATURES_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving feature settings:', error);
            throw error;
        }
    }

    /**
     * Get feature settings (returns defaults if none saved)
     */
    static async getFeatureSettings(): Promise<FeatureSettings> {
        try {
            const settings = await AsyncStorage.getItem(FEATURES_KEY);
            if (settings) {
                return { ...DEFAULT_FEATURE_SETTINGS, ...JSON.parse(settings) };
            }
            return DEFAULT_FEATURE_SETTINGS;
        } catch (error) {
            console.error('Error getting feature settings:', error);
            return DEFAULT_FEATURE_SETTINGS;
        }
    }

    /**
     * Save safe locations
     */
    static async saveSafeLocations(locations: SafeLocation[]): Promise<void> {
        try {
            await AsyncStorage.setItem(SAFE_LOCATIONS_KEY, JSON.stringify(locations));
        } catch (error) {
            console.error('Error saving safe locations:', error);
            throw error;
        }
    }

    /**
     * Get all safe locations
     */
    static async getSafeLocations(): Promise<SafeLocation[]> {
        try {
            const locations = await AsyncStorage.getItem(SAFE_LOCATIONS_KEY);
            return locations ? JSON.parse(locations) : [];
        } catch (error) {
            console.error('Error getting safe locations:', error);
            return [];
        }
    }

    /**
     * Add a new safe location
     */
    static async addSafeLocation(location: SafeLocation): Promise<void> {
        const locations = await this.getSafeLocations();
        locations.push(location);
        await this.saveSafeLocations(locations);
    }

    /**
     * Delete a safe location by ID
     */
    static async deleteSafeLocation(id: string): Promise<void> {
        const locations = await this.getSafeLocations();
        const filtered = locations.filter(loc => loc.id !== id);
        await this.saveSafeLocations(filtered);
    }

    /**
     * Get master password (defaults to '1234' if never set)
     */
    static async getMasterPassword(): Promise<string> {
        try {
            const pw = await AsyncStorage.getItem(MASTER_PASSWORD_KEY);
            return pw ?? '1234';
        } catch {
            return '1234';
        }
    }

    /**
     * Save new master password
     */
    static async saveMasterPassword(password: string): Promise<void> {
        try {
            await AsyncStorage.setItem(MASTER_PASSWORD_KEY, password);
        } catch (error) {
            console.error('Error saving master password:', error);
            throw error;
        }
    }
}

