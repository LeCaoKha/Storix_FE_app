import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card, SafeAreaHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useLogout } from '@/hooks/auth.hooks';
import { useTasks } from '@/hooks/task.hooks';
import { useProfile } from '@/hooks/user.hooks';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { TaskStatus } from '@/types/order';

// Map backend English role names to Vietnamese display names
const ROLE_DISPLAY_NAMES: Record<string, string> = {
    'Manager': 'Quản lý',
    'Staff': 'Nhân viên',
    'Company Administrator': 'Quản trị viên',
    'Super Admin': 'Quản trị hệ thống',
};

const getRoleDisplayName = (roleName?: string, roleId?: number): string => {
    if (roleName && ROLE_DISPLAY_NAMES[roleName]) return ROLE_DISPLAY_NAMES[roleName];
    if (roleId === 4) return 'Nhân viên';
    if (roleId === 3) return 'Quản lý';
    if (roleId === 2) return 'Quản trị viên';
    return roleName || 'Người dùng';
};

export default function ProfileScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { mutateAsync: logout } = useLogout();
    const { data: profile, isLoading: isFetchingProfile } = useProfile(user?.id);
    const isStaff = user?.roleId === 4;
    const { data: tasks = [], isLoading: isFetchingTasks } = useTasks();

    const handleLogout = () => {
        AlertService.confirm(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?',
            async () => {
                try {
                    await logout();
                    router.replace('/login');
                } catch (error) {
                    console.error('Logout error:', error);
                    router.replace('/login');
                }
            }
        );
    };

    const menuItems = [
        {
            icon: 'user',
            title: 'Thông tin cá nhân',
            subtitle: 'Cập nhật hồ sơ',
            onPress: () => router.push('/profile/edit' as any),
        },
        {
            icon: 'map',
            title: 'Sơ đồ kho',
            subtitle: 'Xem sơ đồ mặt bằng kho',
            onPress: () => {
                const targetPath = user?.roleId === 4 ? '/(staff-tabs)/warehouse' : '/(manager-tabs)/warehouse';
                router.push(targetPath as any);
            },
        },
        {
            icon: 'lock',
            title: 'Đổi mật khẩu',
            subtitle: 'Cập nhật mật khẩu',
            onPress: () => router.push('/profile/change-password' as any),
        },
        // Removed non-functional items: Thông báo, Ngôn ngữ, Trợ giúp, Giới thiệu
    ];

    if (isFetchingProfile || (isStaff && isFetchingTasks)) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const completedTasksCount = isStaff ? tasks.filter(t => t.status === TaskStatus.COMPLETED).length : 0;

    return (
        <View style={styles.container}>
            <SafeAreaHeader backgroundColor="#fff" showBackButton={false} style={styles.safeHeader}>
                <Text style={styles.headerTitle}>Tài khoản</Text>
            </SafeAreaHeader>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* Profile Card */}
                    <Card style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                {profile?.avatar ? (
                                    <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Feather name="user" size={32} color={COLORS.primary} />
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.editAvatarButton}
                                onPress={() => router.push('/profile/edit' as any)}
                            >
                                <Feather name="camera" size={14} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.userName}>{profile?.fullName || getRoleDisplayName(undefined, user?.roleId)}</Text>
                        <Text style={styles.userRole}>
                            {getRoleDisplayName(profile?.roleName, user?.roleId)}
                        </Text>

                        {isStaff && (
                            <View style={styles.userStats}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{tasks.length}</Text>
                                    <Text style={styles.statLabel}>Nhiệm vụ</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{completedTasksCount}</Text>
                                    <Text style={styles.statLabel}>Hoàn thành</Text>
                                </View>
                            </View>
                        )}
                    </Card>

                    {/* Employee Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
                        <Card style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconBox}>
                                    <Feather name="credit-card" size={18} color={COLORS.textMuted} />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>ID người dùng</Text>
                                    <Text style={styles.infoValue}>{user?.id}</Text>
                                </View>
                            </View>
                            <View style={styles.infoDivider} />
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconBox}>
                                    <Feather name="mail" size={18} color={COLORS.textMuted} />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Email</Text>
                                    <Text style={styles.infoValue}>{profile?.email || user?.email}</Text>
                                </View>
                            </View>
                            {profile?.phone && (
                                <>
                                    <View style={styles.infoDivider} />
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoIconBox}>
                                            <Feather name="phone" size={18} color={COLORS.textMuted} />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={styles.infoLabel}>Số điện thoại</Text>
                                            <Text style={styles.infoValue}>{profile.phone}</Text>
                                        </View>
                                    </View>
                                </>
                            )}
                            <View style={styles.infoDivider} />
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconBox}>
                                    <Feather name="home" size={18} color={COLORS.textMuted} />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Mã công ty</Text>
                                    <Text style={styles.infoValue}>{user?.companyId || '-'}</Text>
                                </View>
                            </View>
                        </Card>
                    </View>

                    {/* Settings Menu */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cài đặt</Text>
                        <Card style={styles.menuCard}>
                            {menuItems.map((item, index) => (
                                <View key={index}>
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={item.onPress}
                                    >
                                        <View style={styles.menuIconContainer}>
                                            <Feather name={item.icon as any} size={20} color={COLORS.primary} />
                                        </View>
                                        <View style={styles.menuContent}>
                                            <Text style={styles.menuTitle}>{item.title}</Text>
                                            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                                        </View>
                                        <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                                    </TouchableOpacity>
                                    {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
                                </View>
                            ))}
                        </Card>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Feather name="log-out" size={18} color="#EF4444" />
                        <Text style={styles.logoutText}>Đăng xuất</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc', // Slightly cleaner background
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    safeHeader: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    content: {
        padding: 16, // Consistent 8pt
    },
    profileCard: {
        alignItems: 'center',
        paddingVertical: 16, // Reduced height
        marginBottom: 16,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 86, // Shrink avatar ~15%
        height: 86,
        borderRadius: 43,
        backgroundColor: '#CCFBF1',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
        overflow: 'hidden',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 20, // Slightly smaller
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    userRole: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginBottom: 16,
    },
    userStats: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#f1f5f9',
    },
    statValue: {
        fontSize: 22, // Increased font size
        fontWeight: '700',
        color: COLORS.text,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '500', // Better hierarchy
        opacity: 0.8,
    },
    section: {
        marginTop: 24, // 8pt Rhythm
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textMuted,
        textTransform: 'uppercase', // Section labels often look better in caps
        letterSpacing: 0.5,
        marginBottom: 12, // 8pt
        paddingLeft: 4,
    },
    infoCard: {
        padding: 0, // Control padding per row
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    infoIconBox: {
        width: 32,
        alignItems: 'center',
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 11, // 2-3px difference
        color: COLORS.textMuted,
        fontWeight: '500',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '600',
    },
    infoDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginLeft: 56, // Inset divider (matches text start)
    },
    menuCard: {
        padding: 0,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    menuSubtitle: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 1,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginLeft: 60, // Inset to match text start
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 32, // Increase spacing
        borderWidth: 1,
        borderColor: '#fee2e2',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#EF4444',
    },
});
