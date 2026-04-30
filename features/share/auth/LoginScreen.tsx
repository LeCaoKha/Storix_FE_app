import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRootNavigationState, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input } from '@/components';
import { COLORS } from '@/constants/color';
import { useLogin } from '@/hooks/auth.hooks';
import { useTranslation } from '@/hooks/useTranslation';
import { getUserById, getUserProfile, mergeUserProfileIntoUser } from '@/services/user.api';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginScreen() {
    const { t, language, setLanguage } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const rootNavigationState = useRootNavigationState();
    const { mutateAsync: login, isPending: isLoading } = useLogin();
    const loginStore = useAuthStore((state) => state.login);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLanguageToggle = () => {
        setLanguage(language === 'en' ? 'vi' : 'en');
    };

    // Tự động đăng nhập nếu đã có token
    React.useEffect(() => {
        // Chỉ điều hướng khi root layout đã mount (tránh lỗi Render Error)
        if (!rootNavigationState?.key) return;

        const { token, user } = useAuthStore.getState();
        if (token && user) {
            // Thêm một chút delay để đảm bảo Navigator đã hoàn toàn sẵn sàng nhận lệnh
            const timeout = setTimeout(() => {
                console.log('[Auth] Found existing session, redirecting...', { roleId: user.roleId });
                if (user.roleId === 2 || user.roleId === 3) {
                    router.replace('/(manager-tabs)/requisitions' as any);
                } else {
                    router.replace('/(staff-tabs)/tasks' as any);
                }
            }, 1);
            return () => clearTimeout(timeout);
        }
    }, [rootNavigationState?.key]);

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
                const [userSummary, userProfile] = await Promise.allSettled([
                    getUserById(data.userId),
                    getUserProfile(data.userId),
                ]);

                const mergedPayload = {
                    ...(userSummary.status === 'fulfilled' ? userSummary.value : {}),
                    ...(userProfile.status === 'fulfilled' ? userProfile.value : {}),
                    WarehouseId: data.warehouseId,
                    WarehouseName: data.warehouseName,
                } as any;

                const mergedUser = mergeUserProfileIntoUser({
                    id: data.userId,
                    roleId: data.roleId,
                    companyId: data.companyId,
                    email: email,
                    warehouseId: data.warehouseId,
                    warehouseName: data.warehouseName,
                }, mergedPayload);

                console.log('User profile fetched (raw):', {
                    warehouseIdFromLogin: data.warehouseId,
                    warehouseIdFromUserById: userSummary.status === 'fulfilled' ? (userSummary.value as any)?.warehouseId ?? (userSummary.value as any)?.WarehouseId : null,
                    warehouseIdFromProfile: userProfile.status === 'fulfilled' ? (userProfile.value as any)?.warehouseId ?? (userProfile.value as any)?.WarehouseId : null,
                    mergedWarehouseId: mergedUser.warehouseId,
                    assignmentWarehouseIds: mergedUser.warehouseAssignments?.map((assignment) => assignment.warehouseId) || [],
                });

                // Save to store with extracted profile data
                loginStore(data.accessToken, data.refreshToken, mergedUser);
            } catch (profileError) {
                console.warn('Failed to fetch user profile, using basic info:', profileError);
                // Fallback to basic info if profile fetch fails
                loginStore(data.accessToken, data.refreshToken, {
                    id: data.userId,
                    roleId: data.roleId,
                    companyId: data.companyId,
                    email: email,
                    warehouseId: data.warehouseId,
                    warehouseName: data.warehouseName,
                    warehouseAssignments: data.warehouseId
                        ? [{
                            warehouseId: data.warehouseId,
                            warehouse: { id: data.warehouseId, name: data.warehouseName },
                        }]
                        : undefined,
                });
            }

            console.log('After loginStore - checking store state:', {
                hasToken: !!useAuthStore.getState().token,
                tokenLength: useAuthStore.getState().token?.length,
                hasUser: !!useAuthStore.getState().user,
                hasWarehouse: !!useAuthStore.getState().user?.warehouseId,
                assignmentWarehouseIds: useAuthStore.getState().user?.warehouseAssignments?.map((assignment) => assignment.warehouseId) || [],
            });

            // Small delay to ensure AsyncStorage write completes
            await new Promise(resolve => setTimeout(resolve, 100));

            // Navigate based on roleId
            // 2: Company Admin, 3: Manager
            if (data.roleId === 2 || data.roleId === 3) {
                router.replace('/(manager-tabs)/requisitions' as any);
            } else {
                // 4: Staff or others
                router.replace('/(staff-tabs)/tasks' as any);
            }
        } catch (error) {
            console.error('Login failed:', error);
            AlertService.error(t('auth.loginFailedTitle'), t('auth.loginFailedMsg'));
        }
    };


    return (
        <KeyboardAvoidingView
            behavior="padding"
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'android' ? -100 : 0}
        >
            <StatusBar style="light" />
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t('profile.language')}
                onPress={handleLanguageToggle}
                style={[styles.floatingLanguageButton, { top: insets.top + 10 }]}
            >
                <Text style={[styles.languageText, language === 'en' && styles.languageTextActive]}>EN</Text>
                <Text style={styles.languageDivider}>|</Text>
                <Text style={[styles.languageText, language === 'vi' && styles.languageTextActive]}>VI</Text>
            </TouchableOpacity>

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
                        <View style={styles.logoContainer}>
                            <ExpoImage
                                source={require('@/assets/images/logoStorix.png')}
                                style={{ width: 130, height: 130 }}
                                contentFit="contain"
                            />
                        </View>
                        <Text style={styles.appTagline}>Warehouse Management System</Text>
                    </View>
                </LinearGradient>

                <View style={styles.contentContainer}>
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>{t('auth.login')}</Text>
                        <Text style={styles.formSubtitle}>{t('auth.loginSubtitle')}</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('auth.email')}</Text>
                            <Input
                                placeholder={t('auth.enterEmail')}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                style={styles.input}
                                leftIcon={<Feather name="user" size={20} color={COLORS.slate500} />}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('auth.password')}</Text>
                            <Input
                                placeholder={t('auth.enterPassword')}
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
                            <Text
                                style={styles.forgotPassText}
                                onPress={() => router.push('/forgot-password' as any)}
                                suppressHighlighting
                            >
                                {t('auth.forgotPassword')}
                            </Text>
                        </TouchableOpacity>

                        <Button
                            title={t('auth.login')}
                            onPress={handleLogin}
                            loading={isLoading}
                            style={styles.loginButton}
                        />

                        <View style={styles.divider} />

                        <View style={styles.helpSection}>
                            <Feather name="help-circle" size={16} color={COLORS.slate500} />
                            <Text style={styles.helpText}>{t('auth.needHelp')}{t('auth.contactAdmin')}</Text>
                        </View>
                    </View>
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
    floatingLanguageButton: {
        position: 'absolute',
        right: 14,
        minWidth: 74,
        height: 40,
        paddingHorizontal: 12,
        borderRadius: 20,
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(13, 148, 136, 0.42)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.24)',
        zIndex: 20,
        elevation: 10,
    },
    languageText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    languageTextActive: {
        color: '#fff',
    },
    languageDivider: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 12,
        fontWeight: '700',
        marginTop: -1,
    },
    headerBackground: {
        height: '45%',
        alignItems: 'center',
        paddingTop: 80,
        position: 'relative',
    },
    headerContent: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        // Drop shadow trắng nhẹ giúp logo nổi trên nền gradient mà không cần background trắng
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 0,
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
        color: COLORS.text,
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
});
