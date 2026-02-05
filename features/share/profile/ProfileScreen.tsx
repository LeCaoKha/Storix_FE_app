import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card, SafeAreaHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useLogout } from '@/hooks/auth.hooks';
import { useAuthStore } from '@/stores/auth.store';

export default function ProfileScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { mutateAsync: logout } = useLogout();

    // Use user from AuthContext or fallback to mock data
    const userData = {
        name: user?.roleId === 3 ? 'Manager' : user?.roleId === 2 ? 'Admin' : 'Staff',
        email: user?.email || 'No email',
        roleId: user?.roleId,
        id: user?.id,
        companyId: user?.companyId,
    };


    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                {
                    text: 'Hủy',
                    style: 'cancel',
                },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/login' as any);
                    },
                },
            ]
        );
    };

    const menuItems = [
        {
            icon: 'user',
            title: 'Thông tin cá nhân',
            subtitle: 'Cập nhật hồ sơ',
            onPress: () => { },
        },
        {
            icon: 'lock',
            title: 'Đổi mật khẩu',
            subtitle: 'Cập nhật mật khẩu',
            onPress: () => { },
        },
        {
            icon: 'bell',
            title: 'Thông báo',
            subtitle: 'Cài đặt thông báo',
            onPress: () => { },
        },
        {
            icon: 'globe',
            title: 'Ngôn ngữ',
            subtitle: 'Tiếng Việt',
            onPress: () => { },
        },
        {
            icon: 'help-circle',
            title: 'Trợ giúp & Hỗ trợ',
            subtitle: 'Câu hỏi thường gặp, Liên hệ',
            onPress: () => { },
        },
        {
            icon: 'info',
            title: 'Giới thiệu',
            subtitle: 'Phiên bản 1.0.0',
            onPress: () => { },
        },
    ];

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
                                <Feather name="user" size={40} color={COLORS.primary} />
                            </View>
                            <TouchableOpacity style={styles.editAvatarButton}>
                                <Feather name="camera" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.userName}>{userData.name}</Text>
                        <Text style={styles.userRole}>{userData.roleId === 2 ? 'Quản lý kho' : 'Nhân viên kho'}</Text>

                        <View style={styles.userStats}>
                            <View style={styles.statItem}>
                                <Feather name="package" size={20} color={COLORS.primary} />
                                <Text style={styles.statValue}>127</Text>
                                <Text style={styles.statLabel}>Hoàn thành</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Feather name="clock" size={20} color={COLORS.primary} />
                                <Text style={styles.statValue}>95%</Text>
                                <Text style={styles.statLabel}>Hiệu suất</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Feather name="award" size={20} color={COLORS.primary} />
                                <Text style={styles.statValue}>12</Text>
                                <Text style={styles.statLabel}>Tháng</Text>
                            </View>
                        </View>
                    </Card>

                    {/* Employee Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Thông tin nhân viên</Text>
                        <Card>
                            <View style={styles.infoRow}>
                                <Feather name="credit-card" size={18} color={COLORS.textMuted} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Mã nhân viên</Text>
                                    <Text style={styles.infoValue}>{userData.id}</Text>
                                </View>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Feather name="mail" size={18} color={COLORS.textMuted} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Email</Text>
                                    <Text style={styles.infoValue}>{userData.email}</Text>
                                </View>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Feather name="home" size={18} color={COLORS.textMuted} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Mã công ty</Text>
                                    <Text style={styles.infoValue}>{userData.companyId}</Text>
                                </View>
                            </View>
                        </Card>
                    </View>

                    {/* Settings Menu */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cài đặt</Text>
                        <Card style={styles.menuCard}>
                            {menuItems.map((item, index) => (
                                <React.Fragment key={index}>
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
                                    {index < menuItems.length - 1 && <View style={styles.divider} />}
                                </React.Fragment>
                            ))}
                        </Card>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Feather name="log-out" size={20} color="#EF4444" />
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
        backgroundColor: '#f5f5f5',
    },
    safeHeader: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    content: {
        padding: 20,
    },
    profileCard: {
        alignItems: 'center',
        paddingVertical: 30,
        marginBottom: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#CCFBF1',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    userRole: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 20,
    },
    userStats: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.border,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 12,
    },
    menuCard: {
        padding: 0,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#CCFBF1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
});
