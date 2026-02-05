import { Card, RequisitionItemList, ScreenHeader, StatusBadge } from '@/components';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '@/constants/color';
import { useRequisition } from '@/hooks';

export default function RequisitionDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data: requisition, isLoading } = useRequisition(id!);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Đang tải...</Text>
            </View>
        );
    }

    if (!requisition) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={64} color={COLORS.border} />
                    <Text style={styles.errorTitle}>Không tìm thấy phiếu đề xuất</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const typeConfig = requisition.type === 'inbound'
        ? { label: 'Nhập kho', icon: 'arrow-down-circle' as const, color: '#3B82F6' }
        : { label: 'Xuất kho', icon: 'arrow-up-circle' as const, color: '#8B5CF6' };

    const canEdit = requisition.status === 'pending';
    const canCreateOrder = requisition.status === 'approved' && !requisition.linkedOrderId;

    const handleEdit = () => {
        // TODO: Navigate to edit screen
        Alert.alert('Chức năng đang phát triển', 'Tính năng chỉnh sửa sẽ sớm được cập nhật');
    };

    const handleCreateOrder = () => {
        const route = requisition.type === 'inbound'
            ? `/manager/orders/inbound/create?requisitionId=${requisition.id}`
            : `/manager/orders/outbound/create?requisitionId=${requisition.id}`;
        router.push(route as any);
    };

    const handleViewOrder = () => {
        // TODO: Navigate to order detail
        Alert.alert('Xem đơn hàng', `Đơn hàng: ${requisition.linkedOrderNumber}`);
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Chi tiết đề xuất"
                subtitle={requisition.requisitionNumber}
                rightButton={
                    canEdit ? (
                        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                            <Feather name="edit-2" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    ) : undefined
                }
            />

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Status Card */}
                <Card style={styles.card}>
                    <View style={styles.statusRow}>
                        <View style={styles.typeContainer}>
                            <View style={[styles.typeIconLarge, { backgroundColor: typeConfig.color + '20' }]}>
                                <Feather name={typeConfig.icon} size={28} color={typeConfig.color} />
                            </View>
                            <View>
                                <Text style={styles.typeLabel}>{typeConfig.label}</Text>
                                <Text style={styles.requisitionNumber}>{requisition.requisitionNumber}</Text>
                            </View>
                        </View>
                        <StatusBadge status={requisition.status} size="large" />
                    </View>
                </Card>

                {/* Rejection Notice */}
                {requisition.status === 'rejected' && requisition.rejectionReason && (
                    <Card style={styles.rejectionCard}>
                        <View style={styles.rejectionHeader}>
                            <Feather name="x-circle" size={20} color="#EF4444" />
                            <Text style={styles.rejectionTitle}>Lý do từ chối</Text>
                        </View>
                        <Text style={styles.rejectionReason}>{requisition.rejectionReason}</Text>
                        {requisition.reviewedByName && (
                            <Text style={styles.rejectionReviewer}>
                                Người duyệt: {requisition.reviewedByName}
                            </Text>
                        )}
                    </Card>
                )}

                {/* Details Card */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Thông tin chung</Text>
                </View>
                <Card style={styles.card}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Feather name="user" size={16} color={COLORS.textMuted} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Người tạo</Text>
                            <Text style={styles.detailValue}>{requisition.createdByName}</Text>
                        </View>
                    </View>
                    <View style={styles.detailDivider} />

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Feather name="calendar" size={16} color={COLORS.textMuted} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Ngày tạo</Text>
                            <Text style={styles.detailValue}>
                                {new Date(requisition.createdAt).toLocaleString('vi-VN')}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.detailDivider} />

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Feather name="clock" size={16} color={COLORS.textMuted} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Ngày dự kiến</Text>
                            <Text style={styles.detailValue}>
                                {new Date(requisition.expectedDate).toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.detailDivider} />

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Feather name="map-pin" size={16} color={COLORS.textMuted} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Kho</Text>
                            <Text style={styles.detailValue}>{requisition.warehouse}</Text>
                        </View>
                    </View>
                </Card>

                {/* Purpose */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Mục đích</Text>
                </View>
                <Card style={styles.card}>
                    <Text style={styles.purposeText}>{requisition.purpose}</Text>
                </Card>

                {/* Items */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Danh sách sản phẩm</Text>
                    <Text style={styles.itemCount}>{requisition.items.length} mặt hàng</Text>
                </View>
                <RequisitionItemList items={requisition.items} showNotes />

                {/* Notes */}
                {requisition.notes && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Ghi chú</Text>
                        </View>
                        <Card style={styles.card}>
                            <Text style={styles.notesText}>{requisition.notes}</Text>
                        </Card>
                    </>
                )}

                {/* Linked Order */}
                {requisition.linkedOrderNumber && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Đơn hàng đã tạo</Text>
                        </View>
                        <TouchableOpacity onPress={handleViewOrder}>
                            <Card style={styles.card}>
                                <View style={styles.linkedOrderRow}>
                                    <View style={styles.linkedOrderIcon}>
                                        <Feather name="package" size={20} color={COLORS.primary} />
                                    </View>
                                    <View style={styles.linkedOrderContent}>
                                        <Text style={styles.linkedOrderNumber}>
                                            {requisition.linkedOrderNumber}
                                        </Text>
                                        <Text style={styles.linkedOrderLabel}>Xem chi tiết đơn hàng</Text>
                                    </View>
                                    <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                                </View>
                            </Card>
                        </TouchableOpacity>
                    </>
                )}

                {/* Approval Info */}
                {requisition.status !== 'pending' && requisition.reviewedByName && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Thông tin duyệt</Text>
                        </View>
                        <Card style={styles.card}>
                            <View style={styles.detailRow}>
                                <View style={styles.detailIcon}>
                                    <Feather name="user-check" size={16} color={COLORS.textMuted} />
                                </View>
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Người duyệt</Text>
                                    <Text style={styles.detailValue}>{requisition.reviewedByName}</Text>
                                </View>
                            </View>
                            {requisition.reviewedAt && (
                                <>
                                    <View style={styles.detailDivider} />
                                    <View style={styles.detailRow}>
                                        <View style={styles.detailIcon}>
                                            <Feather name="calendar" size={16} color={COLORS.textMuted} />
                                        </View>
                                        <View style={styles.detailContent}>
                                            <Text style={styles.detailLabel}>Ngày duyệt</Text>
                                            <Text style={styles.detailValue}>
                                                {new Date(requisition.reviewedAt).toLocaleString('vi-VN')}
                                            </Text>
                                        </View>
                                    </View>
                                </>
                            )}
                        </Card>
                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Buttons */}
            {canCreateOrder && (
                <View style={styles.actionBar}>
                    <TouchableOpacity
                        style={styles.createOrderButton}
                        onPress={handleCreateOrder}
                    >
                        <Feather name="plus-circle" size={20} color="#fff" />
                        <Text style={styles.createOrderButtonText}>Tạo đơn hàng</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerBackButton: {
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    editButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    card: {
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    typeIconLarge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    requisitionNumber: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.text,
    },
    rejectionCard: {
        marginBottom: 16,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    rejectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    rejectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#991B1B',
    },
    rejectionReason: {
        fontSize: 14,
        color: '#7C2D12',
        lineHeight: 20,
        marginBottom: 8,
    },
    rejectionReviewer: {
        fontSize: 12,
        color: '#991B1B',
        fontStyle: 'italic',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    itemCount: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    detailIcon: {
        width: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    detailDivider: {
        height: 1,
        backgroundColor: COLORS.border,
    },
    purposeText: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 22,
    },
    notesText: {
        fontSize: 14,
        color: COLORS.textMuted,
        lineHeight: 22,
        fontStyle: 'italic',
    },
    linkedOrderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    linkedOrderIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkedOrderContent: {
        flex: 1,
    },
    linkedOrderNumber: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 2,
    },
    linkedOrderLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    createOrderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    createOrderButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 20,
        marginBottom: 16,
    },
    backButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
