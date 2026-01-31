import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BackButton } from '@/components/ui/BackButton';
import { Card } from '@/components/ui/Card';
import { LocationBadge } from '@/components/ui/LocationBadge';
import { PathViewModal } from '@/components/ui/PathViewModal';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { ReportIssueModal } from '@/components/ui/ReportIssueModal';
import { COLORS } from '@/constants/color';
import type { IssueType, Order } from '@/types/order';

export default function OutboundOrderTicketScreen() {
    const router = useRouter();
    const [showPathView, setShowPathView] = useState(false);
    const [showReportIssue, setShowReportIssue] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);

    const [order, setOrder] = useState<Order>({
        id: '1',
        orderNumber: 'OUT-2026-001',
        type: 'outbound',
        status: 'in_progress',
        createdAt: new Date('2026-01-30T10:00:00'),
        assignedDateTime: new Date('2026-01-30T10:00:00'),
        warehouse: 'WH-HCM-01',
        priority: 'high',
        requiredShipDate: new Date('2026-02-01'),

        customerName: 'ABC Electronics Co.',
        customerCode: 'CUST-001',
        deliveryAddress: '123 Nguyen Hue, District 1, Ho Chi Minh City',
        shippingMethod: 'Express Delivery',
        assignedTo: 'Staff User',

        totalQuantity: 30,
        pickedQuantity: 13,
        scanErrorCount: 0,

        items: [
            {
                id: '1',
                productName: 'Laptop Dell XPS 15',
                sku: 'DELL-XPS15-001',
                quantity: 5,
                locatorCode: 'A-12-3',
                location: 'Zone A - Shelf 12',
                pickedQuantity: 3,
                scannedQuantity: 3,
                status: 'pending',
                aiPickingOrder: 1,
            },
            {
                id: '2',
                productName: 'Wireless Mouse Logitech MX3',
                sku: 'LOG-MX3-002',
                quantity: 10,
                locatorCode: 'B-05-2',
                location: 'Zone B - Bin 5',
                pickedQuantity: 10,
                scannedQuantity: 10,
                status: 'picked',
                aiPickingOrder: 2,
            },
            {
                id: '3',
                productName: 'USB-C Cable 2m',
                sku: 'USBC-2M-003',
                quantity: 15,
                locatorCode: 'A-08-1',
                location: 'Zone A - Shelf 8',
                pickedQuantity: 0,
                scannedQuantity: 0,
                status: 'pending',
                aiPickingOrder: 3,
            },
        ],
        notes: 'Handle with care - fragile items',
    });

    // Timer for elapsed time
    useEffect(() => {
        if (order.status === 'in_progress') {
            const interval = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [order.status]);

    const handleStartPicking = () => {
        setOrder({ ...order, status: 'in_progress' });
    };

    const handleCompleteOrder = () => {
        Alert.alert(
            'Hoàn Thành Đơn Hàng',
            'Bạn có chắc chắn đã lấy đủ tất cả sản phẩm?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác Nhận',
                    onPress: () => {
                        setOrder({ ...order, status: 'completed' });
                        Alert.alert('Thành Công', 'Đơn hàng đã được hoàn thành!');
                    }
                },
            ]
        );
    };

    const handleReportIssue = (report: { issueType: IssueType; itemId?: string; description: string }) => {
        console.log('Issue reported:', report);
        Alert.alert('Đã Gửi Báo Cáo', 'Báo cáo của bạn đã được gửi đến quản lý kho.');
    };

    const getTotalProgress = () => {
        const percentage = ((order.pickedQuantity || 0) / order.totalQuantity) * 100;
        return {
            total: order.totalQuantity,
            picked: order.pickedQuantity || 0,
            percentage,
        };
    };

    const getNextItem = () => {
        return order.items
            .filter(item => (item.scannedQuantity || 0) < item.quantity)
            .sort((a, b) => (a.aiPickingOrder || 0) - (b.aiPickingOrder || 0))[0];
    };

    const progress = getTotalProgress();
    const nextItem = getNextItem();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const canComplete = progress.percentage >= 100;

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <BackButton />
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Outbound Order</Text>
                        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => setShowReportIssue(true)}
                        >
                            <Feather name="alert-circle" size={20} color="#EF4444" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.headerButton,
                                styles.completeButton,
                                !canComplete && styles.completeButtonDisabled
                            ]}
                            onPress={handleCompleteOrder}
                            disabled={!canComplete}
                        >
                            <Feather name="check" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Warehouse & Priority Info */}
                <View style={styles.headerMeta}>
                    <View style={styles.metaItem}>
                        <Feather name="home" size={14} color={COLORS.textMuted} />
                        <Text style={styles.metaText}>{order.warehouse}</Text>
                    </View>
                    <PriorityBadge priority={order.priority} size="small" />
                    {order.requiredShipDate && (
                        <View style={styles.metaItem}>
                            <Feather name="calendar" size={14} color={COLORS.textMuted} />
                            <Text style={styles.metaText}>
                                Ship by: {order.requiredShipDate.toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Progress */}
                <View style={styles.headerProgress}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Overall Progress</Text>
                        <Text style={styles.progressValue}>
                            {progress.picked}/{progress.total} items ({Math.round(progress.percentage)}%)
                        </Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress.percentage}%` }]} />
                    </View>

                    {/* Metrics Row */}
                    <View style={styles.metricsRow}>
                        <View style={styles.metric}>
                            <Feather name="clock" size={16} color={COLORS.textMuted} />
                            <Text style={styles.metricLabel}>Time:</Text>
                            <Text style={styles.metricValue}>{formatTime(timeElapsed)}</Text>
                        </View>
                        <View style={styles.metric}>
                            <Feather name="alert-circle" size={16} color={COLORS.textMuted} />
                            <Text style={styles.metricLabel}>Errors:</Text>
                            <Text style={styles.metricValue}>{order.scanErrorCount || 0}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                {/* Next Item Card */}
                {nextItem && order.status === 'in_progress' && (
                    <Card style={styles.nextItemCard}>
                        <View style={styles.nextItemHeader}>
                            <Feather name="navigation" size={20} color={COLORS.primary} />
                            <Text style={styles.nextItemTitle}>Next Item to Pick</Text>
                        </View>
                        <Text style={styles.nextItemName}>{nextItem.productName}</Text>
                        <View style={styles.nextItemDetails}>
                            <LocationBadge locationCode={nextItem.locatorCode || ''} />
                            <Text style={styles.nextItemQuantity}>
                                Need: {nextItem.quantity - (nextItem.scannedQuantity || 0)}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.viewPathButton}
                            onPress={() => setShowPathView(true)}
                        >
                            <Feather name="map" size={18} color="#fff" />
                            <Text style={styles.viewPathButtonText}>View Path</Text>
                        </TouchableOpacity>
                    </Card>
                )}

                {/* Items List - MOVED TO TOP */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Items to Pick ({order.items.length})</Text>
                    {order.items
                        .sort((a, b) => (a.aiPickingOrder || 0) - (b.aiPickingOrder || 0))
                        .map((item) => (
                            <Card key={item.id} style={styles.itemCard}>
                                <View style={styles.itemHeader}>
                                    <View style={styles.itemOrder}>
                                        <Text style={styles.itemOrderNumber}>{item.aiPickingOrder}</Text>
                                    </View>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName}>{item.productName}</Text>
                                        <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                                    </View>
                                    {item.status === 'picked' && (
                                        <Feather name="check-circle" size={24} color="#10B981" />
                                    )}
                                </View>

                                <View style={styles.itemDetails}>
                                    <LocationBadge locationCode={item.locatorCode || ''} />
                                    <View style={styles.itemQuantities}>
                                        <Text style={styles.quantityText}>
                                            {item.scannedQuantity || 0}/{item.quantity}
                                        </Text>
                                    </View>
                                </View>

                                {item.status !== 'picked' && (
                                    <View style={styles.itemProgress}>
                                        <View style={styles.itemProgressBar}>
                                            <View style={[
                                                styles.itemProgressFill,
                                                { width: `${((item.scannedQuantity || 0) / item.quantity) * 100}%` }
                                            ]} />
                                        </View>
                                    </View>
                                )}
                            </Card>
                        ))}
                </View>

                {/* Customer Information - MOVED TO BOTTOM */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Customer Information</Text>
                    <Card>
                        <View style={styles.infoRow}>
                            <Feather name="user" size={18} color={COLORS.textMuted} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Customer</Text>
                                <Text style={styles.infoValue}>
                                    {order.customerName}{' '}
                                    {order.customerCode && (
                                        <Text style={styles.infoCode}>({order.customerCode})</Text>
                                    )}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Feather name="map-pin" size={18} color={COLORS.textMuted} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Delivery Address</Text>
                                <Text style={styles.infoValue}>{order.deliveryAddress}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Feather name="truck" size={18} color={COLORS.textMuted} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Shipping Method</Text>
                                <Text style={styles.infoValue}>{order.shippingMethod}</Text>
                            </View>
                        </View>
                    </Card>
                </View>

                {/* Notes */}
                {order.notes && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        <Card style={styles.notesCard}>
                            <Feather name="alert-circle" size={18} color={COLORS.warning} />
                            <Text style={styles.notesText}>{order.notes}</Text>
                        </Card>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actions}>
                    {order.status === 'pending' && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.primaryButton]}
                            onPress={handleStartPicking}
                        >
                            <Feather name="play-circle" size={20} color="#fff" />
                            <Text style={styles.primaryButtonText}>Start Picking</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={{ height: 40 }} />

            {/* Path View Modal */}
            <PathViewModal
                visible={showPathView}
                onClose={() => setShowPathView(false)}
                items={order.items}
                title="Optimal Picking Path"
            />

            {/* Report Issue Modal */}
            <ReportIssueModal
                visible={showReportIssue}
                onClose={() => setShowReportIssue(false)}
                onSubmit={handleReportIssue}
                orderNumber={order.orderNumber}
                items={order.items}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    orderNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completeButton: {
        backgroundColor: COLORS.primary,
    },
    completeButtonDisabled: {
        backgroundColor: COLORS.textMuted,
        opacity: 0.5,
    },
    headerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    headerProgress: {
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 8,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    progressValue: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#fff',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 4,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    metric: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metricLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    metricValue: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
    },
    content: {
        padding: 20,
    },
    nextItemCard: {
        backgroundColor: '#CCFBF1',
        borderColor: COLORS.primary,
        borderWidth: 2,
        marginBottom: 20,
    },
    nextItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    nextItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        textTransform: 'uppercase',
    },
    nextItemName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
    },
    nextItemDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    nextItemQuantity: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    viewPathButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
    },
    viewPathButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
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
    infoCode: {
        color: COLORS.textMuted,
        fontSize: 13,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 12,
    },
    itemCard: {
        marginBottom: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 12,
    },
    itemOrder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemOrderNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    itemSku: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    itemDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    itemQuantities: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    quantityText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },
    itemProgress: {
        marginTop: 8,
    },
    itemProgressBar: {
        height: 4,
        backgroundColor: COLORS.secondary,
        borderRadius: 2,
        overflow: 'hidden',
    },
    itemProgressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    notesCard: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#FFFBEB',
        borderColor: COLORS.warning,
        borderWidth: 1,
    },
    notesText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
    },
    actions: {
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
