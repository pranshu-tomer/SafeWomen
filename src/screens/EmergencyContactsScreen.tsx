import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    StatusBar,
    Alert,
    Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StorageService } from '../services/StorageService';
import { PermissionsService } from '../services/PermissionsService';

type EmergencyContactsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EmergencyContacts'>;

interface Contact {
    id: string;
    name: string;
    phone: string;
}

const EmergencyContactsScreen = () => {
    const navigation = useNavigation<EmergencyContactsNavigationProp>();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        const { callContact, smsContacts } = await StorageService.getAllContacts();
        const loadedContacts: Contact[] = [];

        if (callContact) {
            loadedContacts.push({
                id: 'call',
                name: 'Emergency Call',
                phone: callContact,
            });
        }

        smsContacts.forEach((phone, index) => {
            loadedContacts.push({
                id: `sms-${index}`,
                name: `SMS Contact ${index + 1}`,
                phone: phone,
            });
        });

        setContacts(loadedContacts);
    };

    const openAddModal = () => {
        setEditingContact(null);
        setName('');
        setPhone('');
        setModalVisible(true);
    };

    const openEditModal = (contact: Contact) => {
        setEditingContact(contact);
        setName(contact.name);
        setPhone(contact.phone);
        setModalVisible(true);
    };

    const persistContacts = async (currentContacts: Contact[]) => {
        if (currentContacts.length === 0) {
            await StorageService.clearAllContacts();
            return;
        }

        const callContact = currentContacts.find(c => c.id === 'call')?.phone || currentContacts[0].phone;
        const smsContacts = currentContacts.filter(c => c.id !== 'call').map(c => c.phone);

        if (smsContacts.length === 0) {
            smsContacts.push(callContact);
        }

        await StorageService.saveContacts(callContact, smsContacts);
    };

    const saveContact = async () => {
        if (!name.trim() || !phone.trim()) {
            Alert.alert('Missing Information', 'Please enter both name and phone number');
            return;
        }

        if (phone.length < 3) {
            Alert.alert('Invalid Number', 'Please enter a valid phone number');
            return;
        }

        let updatedContacts: Contact[];
        if (editingContact) {
            // Update existing contact
            updatedContacts = contacts.map(c =>
                c.id === editingContact.id ? { ...c, name: name.trim(), phone: phone.trim() } : c
            );
        } else {
            // Add new contact
            const newContact: Contact = {
                id: `sms-${Date.now()}`,
                name: name.trim(),
                phone: phone.trim(),
            };
            updatedContacts = [...contacts, newContact];
        }

        setContacts(updatedContacts);
        await persistContacts(updatedContacts);

        setModalVisible(false);
        setName('');
        setPhone('');
    };

    const deleteContact = (id: string) => {
        Alert.alert(
            'Delete Contact',
            'Are you sure you want to delete this contact?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const updatedContacts = contacts.filter(c => c.id !== id);
                        setContacts(updatedContacts);
                        await persistContacts(updatedContacts);
                    },
                },
            ]
        );
    };

    const handleContinue = async () => {
        if (contacts.length === 0) {
            Alert.alert('No Contacts', 'Please add at least one emergency contact');
            return;
        }

        // Save contacts
        const callContact = contacts.find(c => c.id === 'call')?.phone || contacts[0].phone;
        const smsContacts = contacts.filter(c => c.id !== 'call').map(c => c.phone);

        if (smsContacts.length === 0) {
            smsContacts.push(callContact);
        }

        // Request permissions
        const permissions = await PermissionsService.requestAllEmergencyPermissions();

        if (!permissions.call || !permissions.sms) {
            let deniedPerms: 'call' | 'sms' | 'both' = 'both';
            if (permissions.call && !permissions.sms) deniedPerms = 'sms';
            if (!permissions.call && permissions.sms) deniedPerms = 'call';

            PermissionsService.showPermissionDeniedAlert(deniedPerms);

            Alert.alert(
                'Warning',
                'Some permissions were denied. Emergency features may not work properly. Continue anyway?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Continue',
                        onPress: async () => {
                            await StorageService.saveContacts(callContact, smsContacts);
                            navigation.navigate('Home');
                        },
                    },
                ]
            );
            return;
        }

        await StorageService.saveContacts(callContact, smsContacts);
        navigation.navigate('Home');
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
                <Text style={styles.headerTitle}>Emergency Contacts</Text>
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Emergency Contacts</Text>
                <Text style={styles.subtitle}>
                    Add trusted people who will be notified in emergencies
                </Text>

                <FlatList
                    data={contacts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.contactCard}>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactName}>{item.name}</Text>
                                <Text style={styles.contactPhone}>{item.phone}</Text>
                            </View>
                            <View style={styles.contactActions}>
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => openEditModal(item)}
                                >
                                    <Text style={styles.editIcon}>✏️</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => deleteContact(item.id)}
                                >
                                    <Text style={styles.deleteIcon}>🗑️</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                />

                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <Text style={styles.addButtonText}>+ Add Contact</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                    <Text style={styles.continueButtonText}>Continue to Home</Text>
                </TouchableOpacity>
            </View>

            {/* Add/Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingContact ? 'Edit Contact' : 'Add Contact'}
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            placeholderTextColor="#9CA3AF"
                            value={name}
                            onChangeText={setName}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSave]}
                                onPress={saveContact}
                            >
                                <Text style={styles.modalButtonTextSave}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

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
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 24,
        lineHeight: 20,
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 20,
    },
    contactCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    contactPhone: {
        fontSize: 14,
        color: '#6B7280',
    },
    contactActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        padding: 8,
    },
    editIcon: {
        fontSize: 20,
    },
    deleteIcon: {
        fontSize: 20,
    },
    addButton: {
        borderWidth: 2,
        borderColor: '#7C3AED',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#7C3AED',
    },
    continueButton: {
        backgroundColor: '#7C3AED',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#F3F4F6',
    },
    modalButtonSave: {
        backgroundColor: '#7C3AED',
    },
    modalButtonTextCancel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    modalButtonTextSave: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default EmergencyContactsScreen;
