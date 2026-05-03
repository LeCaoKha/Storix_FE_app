import { Card, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { usePaymentStatus } from '@/hooks/payment.hooks';
import { useAuthStore } from '@/stores/auth.store';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PaymentStatusScreen() {
    const { user } = useAuthStore();
    const { data: status, isLoading, error } = usePaymentStatus(user?.companyId ?? 0);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Thanh Toán" />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </View>
        );
    }

    const isPaid = status?.status === 'Success' || status?.status === 'Paid' || status?.status === 'Active';

    return (
        <View style={styles.container}>
            <ScreenHeader title="Trạng Thái Thanh Toán" />

            <ScrollView style={styles.content}>
                <Card style={styles.statusCard}>
                    <View style={[styles.iconContainer, { backgroundColor: isPaid ? COLORS.success + '20' : COLORS.warning + '20' }]}>
                        <Feather
                            name={isPaid ? "shield" : "alert-triangle"}
                            size={48}
                            color={isPaid ? COLORS.success : COLORS.warning}
                        />
                    </View>

                    <Text style={styles.statusTitle}>
                        {isPaid ? 'Gói Dịch Vụ Đang Hoạt Động' : 'Yêu Cầu Thanh Toán'}
                    </Text>

                    <Text style={styles.statusDescription}>
                        {isPaid
                            ? 'Công ty của bạn đang sử dụng gói dịch vụ Storix Premium.'
                            : 'Vui lòng hoàn tất thanh toán để tiếp tục sử dụng đầy đủ các tính năng.'}
                    </Text>
                </Card>

                <Card style={styles.detailsCard}>
                    <Text style={styles.cardTitle}>Chi tiết gói</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Trạng thái:</Text>
                        <View style={[styles.badge, { backgroundColor: isPaid ? COLORS.success + '20' : COLORS.warning + '20' }]}>
                            <Text style={[styles.badgeText, { color: isPaid ? COLORS.success : COLORS.warning }]}>
                                {status?.status || 'Chưa xác định'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Gói dịch vụ:</Text>
                        <Text style={styles.infoValue}>{status?.planName || 'Storix Professional'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Ngày hết hạn:</Text>
                        <Text style={styles.infoValue}>
                            {status?.expiryDate ? new Date(status.expiryDate).toLocaleDateString('vi-VN') : '31/12/2026'}
                        </Text>
                    </View>
                </Card>

                <Card style={styles.helpCard}>
                    <Feather name="help-circle" size={20} color={COLORS.textMuted} />
                    <Text style={styles.helpText}>
                        Nếu bạn có thắc mắc về vấn đề thanh toán, vui lòng liên hệ hotline: 1900 1234
                    </Text>
                </Card>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    statusCard: {
        alignItems: 'center',
        paddingVertical: 30,
        marginBottom: 16,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 10,
    },
    statusDescription: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    detailsCard: {
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    infoLabel: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    helpCard: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
    },
    helpText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textMuted,
        lineHeight: 18,
    },
});
