import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BackButton } from '@/components/ui/BackButton';
import { Card } from '@/components/ui/Card';
import { LocationBadge } from '@/components/ui/LocationBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { COLORS } from '@/constants/color';
import type { Order } from '@/types/order';
import type { StorageSuggestion } from '@/types/warehouse';

export default function InboundOrderTicketScreen() {
    const router = useRouter();
    const [timeElapsed, setTimeElapsed] = useState(0);

    const [order, setOrder] = useState<Order>({
        id: '2',
        orderNumber: 'IN-2026-002',
        type: 'inbound',
        status: 'in_progress',
        createdAt: new Date('2026-01-30T09:00:00'),
        assignedDateTime: new Date('2026-01-30T09:00:00'),
        warehouse: 'WH-HCM-01',
        priority: 'medium',
        arrivalTime: new Date('2026-01-30T14:00:00'),

        supplierName: 'Tech Supplies Vietnam',
        supplierCode: 'SUP-VN-001',
        supplierAddress: '456 Phan Xich Long, Phu Nhuan, Ho Chi Minh City',
        purchaseOrderNumber: 'PO-2026-0042',
        expectedItems: 3,

        assignedTo: 'Staff User',
        totalQuantity: 35,
        receivedQuantity: 5,
        scanErrorCount: 0,

        items: [
            {
                id: '1',
                productName: 'Mechanical Keyboard RGB',
                sku: 'KB-RGB-001',
                quantity: 12,
                suggestedLocation: 'A-15-2',
                receivedQuantity: 5,
                scannedQuantity: 5,
                status: 'pending',
                batchNumber: 'BATCH-2026-001',
                expiryDate: new Date('2027-01-30'),
            },
            {
                id: '2',
                productName: 'Monitor 27" 4K',
                sku: 'MON-27-4K-002',
                quantity: 8,
                suggestedLocation: 'B-10-1',
                receivedQuantity: 0,
                scannedQuantity: 0,
                status: 'pending',
                batchNumber: 'BATCH-2026-002',
            },
            {
                id: '3',
                productName: 'Webcam HD 1080p',
                sku: 'WC-1080-003',
                quantity: 15,
                suggestedLocation: 'A-12-3',
                receivedQuantity: 0,
                scannedQuantity: 0,
                status: 'pending',
            },
        ],
        notes: 'Inspect all items for damage before putaway',
    });

    // Storage suggestions mock
    const [storageSuggestions] = useState<Record<string, StorageSuggestion[]>>({
        'KB-RGB-001': [
            {
                locationCode: 'A-15-2',
                location: {
                    code: 'A-15-2',
                    zone: 'A',
                    aisle: '15',
                    shelf: '2',
                    capacity: 100,
                    currentOccupancy: 45,
                    distanceFromEntry: 25,
                },
                score: 95,
                reasoning: 'High turnover item - near entry for quick access',
            },
        ],
        'MON-27-4K-002': [
            {
                locationCode: 'B-10-1',
                location: {
                    code: 'B-10-1',
                    zone: 'B',
                    aisle: '10',
                    shelf: '1',
                    capacity: 50,
                    currentOccupancy: 12,
                },
                score: 92,
                reasoning: 'Bulk storage zone - suitable for large items',
            },
        ],
        'WC-1080-003': [
            {
                locationCode: 'A-12-3',
                location: {
                    code: 'A-12-3',
                    zone: 'A',
                    aisle: '12',
                    shelf: '3',
                    capacity: 150,
                    currentOccupancy: 78,
                },
                score: 88,
                reasoning: 'Medium turnover area - balanced accessibility',
            },
        ],
    });

    // Timer
    useEffect(() => {
        if (order.status === 'in_progress') {
            const interval = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [order.status]);

    const handleStartReceiving = () => {
        setOrder({ ...order, status: 'in_progress' });
    };

    const handleCompleteOrder = () => {
        Alert.alert(
            'Hoàn Thành Đơn Hàng',
            'Bạn có chắc chắn đã nhận đủ tất cả sản phẩm?',
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

    const handleConfirmReceipt = (itemId: string) => {
        setOrder(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id === itemId) {
                    const newReceived = (item.receivedQuantity || 0) + 1;
                    return {
                        ...item,
                        receivedQuantity: newReceived,
                        scannedQuantity: newReceived,
                        status: newReceived >= item.quantity ? 'received' : 'pending',
                    };
                }
                return item;
            }),
            receivedQuantity: (prev.receivedQuantity || 0) + 1,
        }));
    };

    const getTotalProgress = () => {
        const percentage = ((order.receivedQuantity || 0) / order.totalQuantity) * 100;
        return {
            total: order.totalQuantity,
            received: order.receivedQuantity || 0,
            percentage,
        };
    };

    const getNextItem = () => {
        return order.items.find(item => (item.receivedQuantity || 0) < item.quantity);
    };

    const progress = getTotalProgress();
    const nextItem = getNextItem();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <BackButton />
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Inbound Order</Text>
                        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    </View>
                    <StatusBadge status={order.status} />
                </View>

                {/* Warehouse & Priority Info */}
                <View style={styles.headerMeta}>
                    <View style={styles.metaItem}>
                        <Feather name="home" size={14} color={COLORS.textMuted} />
                        <Text style={styles.metaText}>{order.warehouse}</Text>
                    </View>
                    <PriorityBadge priority={order.priority} size="small" />
                    {order.arrivalTime && (
                        <View style={styles.metaItem}>
                            <Feather name="clock" size={14} color={COLORS.textMuted} />
                            <Text style={styles.metaText}>
                                Arrived: {order.arrivalTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Progress */}
                <View style={styles.headerProgress}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Receiving Progress</Text>
                        <Text style={styles.progressValue}>
                            {progress.received}/{progress.total} items ({Math.round(progress.percentage)}%)
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
                            <Feather name="package" size={16} color={COLORS.textMuted} />
                            <Text style={styles.metricLabel}>Expected:</Text>
                            <Text style={styles.metricValue}>{order.expectedItems} types</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                {/* Next Item Card */}
                {nextItem && order.status === 'in_progress' && (
                    <Card style={styles.nextItemCard}>
                        <View style={styles.nextItemHeader}>
                            <Feather name="download" size={20} color={COLORS.primary} />
                            <Text style={styles.nextItemTitle}>Next Item to Receive</Text>
                        </View>
                        <Text style={styles.nextItemName}>{nextItem.productName}</Text>

                        {/* Smart Storage Suggestion */}
                        {storageSuggestions[nextItem.sku] && (
                            <View style={styles.suggestionCard}>
                                <View style={styles.suggestionHeader}>
                                    <Feather name="zap" size={16} color="#F59E0B" />
                                    <Text style={styles.suggestionTitle}>Suggested Location</Text>
                                </View>
                                <LocationBadge
                                    locationCode={storageSuggestions[nextItem.sku][0].locationCode}
                                    showCapacity
                                    capacity={storageSuggestions[nextItem.sku][0].location.capacity}
                                    occupied={storageSuggestions[nextItem.sku][0].location.currentOccupancy}
                                />
                                <Text style={styles.suggestionReason}>
                                    {storageSuggestions[nextItem.sku][0].reasoning}
                                </Text>
                            </View>
                        )}

                        <View style={styles.nextItemDetails}>
                            <Text style={styles.nextItemQuantity}>
                                Need: {nextItem.quantity - (nextItem.receivedQuantity || 0)}
                            </Text>
                        </View>
                    </Card>
                )}

                {/* Items List - MOVED TO TOP */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Items to Receive ({order.items.length})</Text>
                    {order.items.map((item) => (
                        <Card key={item.id} style={styles.itemCard}>
                            <View style={styles.itemHeader}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.productName}</Text>
                                    <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                                    {item.batchNumber && (
                                        <Text style={styles.itemBatch}>Batch: {item.batchNumber}</Text>
                                    )}
                                </View>
                                {item.status === 'received' && (
                                    <Feather name="check-circle" size={24} color="#10B981" />
                                )}
                            </View>

                            <View style={styles.itemDetails}>
                                <View style={styles.itemDetailRow}>
                                    <Text style={styles.detailLabel}>Suggested Location:</Text>
                                    <LocationBadge locationCode={item.suggestedLocation || 'TBD'} />
                                </View>
                                <View style={styles.itemDetailRow}>
                                    <Text style={styles.detailLabel}>Quantity:</Text>
                                    <Text style={styles.quantityText}>
                                        {item.receivedQuantity || 0}/{item.quantity}
                                    </Text>
                                </View>
                            </View>

                            {item.status !== 'received' && (
                                <>
                                    <View style={styles.itemProgress}>
                                        <View style={styles.itemProgressBar}>
                                            <View style={[
                                                styles.itemProgressFill,
                                                { width: `${((item.receivedQuantity || 0) / item.quantity) * 100}%` }
                                            ]} />
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.confirmButton}
                                        onPress={() => handleConfirmReceipt(item.id)}
                                    >
                                        <Feather name="check" size={16} color={COLORS.primary} />
                                        <Text style={styles.confirmButtonText}>Confirm Receipt (+1)</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </Card>
                    ))}
                </View>

                {/* Receiving Guidelines */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Receiving Guidelines</Text>
                    <Card style={styles.guidelinesCard}>
                        <View style={styles.guidelineItem}>
                            <Feather name="check-square" size={16} color={COLORS.primary} />
                            <Text style={styles.guidelineText}>Verify quantities match the PO</Text>
                        </View>
                        <View style={styles.guidelineItem}>
                            <Feather name="check-square" size={16} color={COLORS.primary} />
                            <Text style={styles.guidelineText}>Inspect items for damage</Text>
                        </View>
                        <View style={styles.guidelineItem}>
                            <Feather name="check-square" size={16} color={COLORS.primary} />
                            <Text style={styles.guidelineText}>Record storage location</Text>
                        </View>
                        <View style={styles.guidelineItem}>
                            <Feather name="check-square" size={16} color={COLORS.primary} />
                            <Text style={styles.guidelineText}>Update inventory in real-time</Text>
                        </View>
                    </Card>
                </View>

                {/* Supplier Information - MOVED TO BOTTOM */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Supplier Information</Text>
                    <Card>
                        <View style={styles.infoRow}>
                            <Feather name="briefcase" size={18} color={COLORS.textMuted} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Supplier</Text>
                                <Text style={styles.infoValue}>
                                    {order.supplierName}{' '}
                                    {order.supplierCode && (
                                        <Text style={styles.infoCode}>({order.supplierCode})</Text>
                                    )}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Feather name="file-text" size={18} color={COLORS.textMuted} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>PO Number</Text>
                                <Text style={styles.infoValue}>{order.purchaseOrderNumber}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Feather name="map-pin" size={18} color={COLORS.textMuted} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Supplier Address</Text>
                                <Text style={styles.infoValue}>{order.supplierAddress}</Text>
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
                            onPress={handleStartReceiving}
                        >
                            <Feather name="download" size={20} color="#fff" />
                            <Text style={styles.primaryButtonText}>Start Receiving</Text>
                        </TouchableOpacity>
                    )}

                    {order.status === 'in_progress' && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.primaryButton]}
                            onPress={handleCompleteOrder}
                            disabled={progress.percentage < 100}
                        >
                            <Feather name="check-circle" size={20} color="#fff" />
                            <Text style={styles.primaryButtonText}>
                                {progress.percentage < 100 ? 'Complete Receiving First' : 'Complete Order'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={{ height: 40 }} />
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
    suggestionCard: {
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    suggestionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    suggestionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#92400E',
    },
    suggestionReason: {
        fontSize: 12,
        color: '#78350F',
        marginTop: 6,
        fontStyle: 'italic',
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
    guidelinesCard: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
        borderWidth: 1,
    },
    guidelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    guidelineText: {
        fontSize: 14,
        color: COLORS.text,
    },
    itemCard: {
        marginBottom: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
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
        marginBottom: 2,
    },
    itemBatch: {
        fontSize: 11,
        color: COLORS.textMuted,
        fontStyle: 'italic',
    },
    itemDetails: {
        gap: 8,
        marginBottom: 8,
    },
    itemDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    detailLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    quantityText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },
    itemProgress: {
        marginTop: 8,
        marginBottom: 8,
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
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: 10,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '15',
    },
    confirmButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
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
