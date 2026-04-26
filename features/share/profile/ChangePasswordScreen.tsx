import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
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
import { useUpdateProfile } from '@/hooks/user.hooks';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const goBack = useAppBack('/(manager-tabs)/profile');
    const { user } = useAuthStore();
    const updateProfileMutation = useUpdateProfile();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSave = async () => {
        if (!password) {
            AlertService.warning('Error', 'Please enter a new password.');
            return;
        }

        if (password.length < 6) {
            AlertService.warning('Error', 'Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            AlertService.warning('Error', 'Confirmation password does not match.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('Password', password);

            await updateProfileMutation.mutateAsync({
                userId: user?.id!,
                formData,
            });

            AlertService.success('Success', 'Password has been changed.', () => {
                goBack();
            });
        } catch (error: any) {
            console.error('[ChangePassword] Error:', error);
            AlertService.error('Error', 'Unable to change password. Please try again.');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <SafeAreaHeader title="Change Password" onBack={goBack} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Feather name="lock" size={40} color={COLORS.primary} />
                    </View>
                    <Text style={styles.title}>Update Password</Text>
                    <Text style={styles.subtitle}>
                        Please enter a new password to secure your account.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.passwordInputContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="At least 6 characters"
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Feather
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color={COLORS.textMuted}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Re-enter new password"
                            secureTextEntry={!showPassword}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, updateProfileMutation.isPending && styles.disabledButton]}
                        onPress={handleSave}
                        disabled={updateProfileMutation.isPending}
                    >
                        {updateProfileMutation.isPending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Update Password</Text>
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
    scrollContent: {
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#CCFBF1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 20,
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
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: COLORS.text,
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
    },
    passwordInput: {
        flex: 1,
        padding: 14,
        fontSize: 16,
        color: COLORS.text,
    },
    eyeIcon: {
        padding: 14,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
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
