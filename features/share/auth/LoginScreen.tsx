import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button, Input } from '@/components';
import { COLORS } from '@/constants/color';
import { useLogin } from '@/hooks/auth.hooks';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginScreen() {
    const router = useRouter();
    const { mutateAsync: login, isPending: isLoading } = useLogin();
    const loginStore = useAuthStore((state) => state.login);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        try {
            const data = await login({ email, password });

            console.log('Login response:', {
                hasToken: !!data.accessToken,
                tokenLength: data.accessToken?.length,
                userId: data.userId,
                roleId: data.roleId,
                companyId: data.companyId
            });

            // Fetch complete user profile to get warehouse assignment
            try {
                const { getUserProfile } = await import('@/services/user.api');
                const userProfile = await getUserProfile(data.userId);

                console.log('User profile fetched:', {
                    warehouseId: userProfile.warehouseId,
                    warehouseName: userProfile.warehouseName
                });

                // Save to store with complete profile data
                loginStore(data.accessToken, {
                    id: data.userId,
                    roleId: data.roleId,
                    companyId: data.companyId,
                    email: email,
                    fullName: userProfile.fullName,
                    phone: userProfile.phone,
                    warehouseId: userProfile.warehouseId,
                    warehouseName: userProfile.warehouseName,
                    roleName: userProfile.roleName,
                    status: userProfile.status,
                });
            } catch (profileError) {
                console.warn('Failed to fetch user profile, using basic info:', profileError);
                // Fallback to basic info if profile fetch fails
                loginStore(data.accessToken, {
                    id: data.userId,
                    roleId: data.roleId,
                    companyId: data.companyId,
                    email: email,
                });
            }

            console.log('After loginStore - checking store state:', {
                hasToken: !!useAuthStore.getState().token,
                tokenLength: useAuthStore.getState().token?.length,
                hasUser: !!useAuthStore.getState().user,
                hasWarehouse: !!useAuthStore.getState().user?.warehouseId
            });

            // Small delay to ensure AsyncStorage write completes
            await new Promise(resolve => setTimeout(resolve, 100));

            // Navigate based on roleId
            // 2: Company Admin, 3: Manager
            if (data.roleId === 2 || data.roleId === 3) {
                router.replace('/(manager-tabs)/requisitions' as any);
            } else {
                // 4: Staff or others
                router.replace('/(staff-tabs)' as any);
            }
        } catch (error) {
            console.error('Login failed:', error);
        }
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
                        <Text style={styles.appTagline}>Hệ thống Quản lý Kho hàng</Text>
                    </View>
                </LinearGradient>

                <View style={styles.contentContainer}>
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Đăng nhập</Text>
                        <Text style={styles.formSubtitle}>Nhập thông tin để tiếp tục</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <Input
                                placeholder="ví dụ: staff@storix.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                style={styles.input}
                                leftIcon={<Feather name="user" size={20} color={COLORS.slate500} />}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mật khẩu</Text>
                            <Input
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                style={styles.input}
                                leftIcon={<Feather name="lock" size={20} color={COLORS.slate500} />}
                                rightIcon={
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Feather
                                            name={showPassword ? "eye-off" : "eye"}
                                            size={20}
                                            color={COLORS.slate500}
                                        />
                                    </TouchableOpacity>
                                }
                            />
                        </View>

                        <TouchableOpacity style={styles.forgotPass}>
                            <Text style={styles.forgotPassText}>Quên mật khẩu?</Text>
                        </TouchableOpacity>

                        <Button
                            title="Đăng nhập"
                            onPress={handleLogin}
                            loading={isLoading}
                            style={styles.loginButton}
                        />

                        <View style={styles.divider} />

                        <View style={styles.helpSection}>
                            <Feather name="help-circle" size={16} color={COLORS.slate500} />
                            <Text style={styles.helpText}>Cần hỗ trợ? Liên hệ Quản trị viên</Text>
                        </View>
                    </View>

                    <Text style={styles.versionText}>v2.4.0 • Phiên bản doanh nghiệp</Text>
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
    rolePickerContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    roleOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: COLORS.slate50,
        borderWidth: 2,
        borderColor: COLORS.slate200,
    },
    roleOptionActive: {
        backgroundColor: '#CCFBF120',
        borderColor: COLORS.primary,
    },
    roleRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.slate500,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleRadioActive: {
        borderColor: COLORS.primary,
    },
    roleRadioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    },
    roleOptionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.slate700,
    },
    roleOptionTextActive: {
        color: COLORS.primary,
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
