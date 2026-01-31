import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLORS } from '@/constants/color';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            router.replace('/(tabs)/tasks');
        }, 1000);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar style="light" />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient
                    colors={[COLORS.primaryLight, COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerBackground}
                >
                    <View style={styles.headerContent}>
                        <Image
                            source={require('@/assets/images/Logo.png')}
                            style={{ width: 150, height: 150, marginBottom: 16 }}
                            resizeMode="contain"
                        />
                        <Text style={styles.appTagline}>Warehouse Management System</Text>
                    </View>
                </LinearGradient>

                <View style={styles.contentContainer}>
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Staff Access</Text>
                        <Text style={styles.formSubtitle}>Enter your credentials to continue</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Employee ID / Email</Text>
                            <Input
                                placeholder="e.g. staff@storix.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                style={styles.input}
                                leftIcon={<Feather name="user" size={20} color={COLORS.slate500} />}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <Input
                                placeholder="Enter password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                style={styles.input}
                                leftIcon={<Feather name="lock" size={20} color={COLORS.slate500} />}
                            />
                        </View>

                        <TouchableOpacity style={styles.forgotPass}>
                            <Text style={styles.forgotPassText}>Reset Password</Text>
                        </TouchableOpacity>

                        <Button
                            title="Login"
                            onPress={handleLogin}
                            isLoading={isLoading}
                            style={styles.loginButton}
                        />

                        <View style={styles.divider} />

                        <View style={styles.helpSection}>
                            <Feather name="help-circle" size={16} color={COLORS.slate500} />
                            <Text style={styles.helpText}>Need help? Contact System Admin</Text>
                        </View>
                    </View>

                    <Text style={styles.versionText}>v2.4.0 • Enterprise Edition</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.slate50,
    },
    headerBackground: {
        height: '45%',
        alignItems: 'center',
        paddingTop: 80,
    },
    headerContent: {
        alignItems: 'center',
    },
    logoBox: {
        width: 64,
        height: 64,
        backgroundColor: '#fff',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    appTagline: {
        fontSize: 14,
        color: COLORS.teal50,
        opacity: 0.8,
        letterSpacing: 0.5,
    },
    contentContainer: {
        flex: 1,
        marginTop: -60,
        paddingHorizontal: 24,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.slate900,
        marginBottom: 6,
    },
    formSubtitle: {
        fontSize: 14,
        color: COLORS.slate500,
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.slate700,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: COLORS.slate50,
        borderColor: COLORS.slate200,
    },
    forgotPass: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPassText: {
        color: COLORS.primaryDark,
        fontWeight: '600',
        fontSize: 13,
    },
    loginButton: {
        backgroundColor: COLORS.primaryDark,
        borderRadius: 12,
        height: 52,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.slate200,
        marginVertical: 20,
    },
    helpSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    helpText: {
        color: COLORS.slate500,
        fontSize: 13,
    },
    versionText: {
        textAlign: 'center',
        marginTop: 'auto',
        marginBottom: 30,
        color: COLORS.slate500,
        fontSize: 12,
        fontWeight: '500',
    }
});
