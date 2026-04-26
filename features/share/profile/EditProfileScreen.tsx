import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { SafeAreaHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useAppBack } from '@/hooks/useAppBack';
import { useProfile, useUpdateProfile } from '@/hooks/user.hooks';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';

export default function EditProfileScreen() {
    const router = useRouter();
    const goBack = useAppBack('/(manager-tabs)/profile');
    const { user } = useAuthStore();
    const { data: profile, isLoading: isFetching } = useProfile(user?.id);
    const updateProfileMutation = useUpdateProfile();

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

    useEffect(() => {
        if (profile) {
            setFullName(profile.fullName || '');
            setPhone(profile.phone || '');
            setEmail(profile.email || '');
            setAvatar(profile.avatar || null);
        }
    }, [profile]);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            AlertService.warning('Permission', 'Please allow access to photo library to change profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setSelectedImage(result.assets[0]);
            setAvatar(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            AlertService.warning('Error', 'Please enter full name.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('FullName', fullName);
            formData.append('Phone', phone);
            formData.append('Email', email);
            // CRITICAL: must send CompanyId or backend will set it to null
            if (user?.companyId) {
                formData.append('CompanyId', String(user.companyId));
            }

            if (selectedImage) {
                const uri = selectedImage.uri;
                const filename = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;

                // @ts-ignore
                formData.append('Avatar', {
                    uri,
                    name: filename,
                    type,
                });
            }

            await updateProfileMutation.mutateAsync({
                userId: user?.id!,
                formData,
            });

            AlertService.success('Success', 'Personal information has been updated.', () => {
                goBack();
            });
        } catch (error: any) {
            console.error('[EditProfile] Save error:', error);
            AlertService.error('Error', 'Unable to update information. Please try again.');
        }
    };

    if (isFetching) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <SafeAreaHeader title="Edit Profile" onBack={goBack} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Feather name="user" size={50} color={COLORS.textMuted} />
                            </View>
                        )}
                        <View style={styles.cameraIcon}>
                            <Feather name="camera" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarHint}>Tap to change photo</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Enter full name"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Enter phone number"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={email}
                            editable={false}
                        />
                        <Text style={styles.inputHint}>Email cannot be changed currently</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, updateProfileMutation.isPending && styles.disabledButton]}
                        onPress={handleSave}
                        disabled={updateProfileMutation.isPending}
                    >
                        {updateProfileMutation.isPending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: COLORS.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarHint: {
        marginTop: 10,
        fontSize: 14,
        color: COLORS.textMuted,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.text,
    },
    disabledInput: {
        backgroundColor: '#f5f5f5',
        color: COLORS.textMuted,
    },
    inputHint: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
