import { Card, SafeAreaHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useOutboundOrder, useUpdateOutboundOrder } from '@/hooks';
import { OutboundOrderItem } from '@/types/outbound-order';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OutboundDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data: order, isLoading, error } = useOutboundOrder(id);
    const updateOrder = useUpdateOutboundOrder();

    const [localQuantities, setLocalQuantities] = useState<Record<string, number>>({});
    const [verifiedItems, setVerifiedItems] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Initialize state when order data is loaded
    useEffect(() => {
        if (order?.items) {
            setLocalQuantities(
                order.items.reduce((acc: Record<string, number>, item: OutboundOrderItem) => ({ ...acc, [item.id]: item.qtyPicked || 0 }), {})
            );
        }
    }, [order]);

    // Business Logic: Sort items by location code for optimized path
    const sortedItems = React.useMemo(() => {
        if (!order) return [];
        return [...order.items].sort((a, b) => {
            const locA = a.pickLocations[0]?.locationCode || '';
            const locB = b.pickLocations[0]?.locationCode || '';
            return locA.localeCompare(locB);
        });
    }, [order]);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <SafeAreaHeader showBackButton>
                    <Text style={styles.headerTitle}>Đang tải...</Text>
                </SafeAreaHeader>
            </View>
        );
    }

    if (!order || error) {
        return (
            <View style={styles.container}>
                <SafeAreaHeader showBackButton>
                    <Text style={styles.headerTitle}>Lỗi</Text>
                </SafeAreaHeader>
                <View style={styles.centered}>
                    <Feather name="alert-circle" size={48} color={COLORS.danger} />
                    <Text style={styles.errorText}>Không tìm thấy thông tin đơn hàng</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const handleVerifyItem = (itemId: string) => {
        setIsSaving(true);
        // Simulate scanning delay
        setTimeout(() => {
            setIsSaving(false);
            setVerifiedItems(prev => ({ ...prev, [itemId]: true }));
            Alert.alert('Thành công', 'Đã xác nhận đúng sản phẩm');
        }, 600);
    };

    const handleUpdateQty = (itemId: string, increment: boolean) => {
        if (!verifiedItems[itemId]) {
            Alert.alert('Lưu ý', 'Vui lòng quét mã sản phẩm để xác minh trước khi lấy hàng');
            return;
        }
        setLocalQuantities(prev => {
            const current = prev[itemId] || 0;
            const item = order.items.find((i: OutboundOrderItem) => i.id === itemId);
            const newValue = increment
                ? Math.min(current + 1, item?.qtyToPick || 9999)
                : Math.max(current - 1, 0);
            return { ...prev, [itemId]: newValue };
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update items with picked quantities
            const updatedItems = order.items.map((item: OutboundOrderItem) => ({
                ...item,
                qtyPicked: localQuantities[item.id] || item.qtyPicked || 0,
            }));

            // Check if all items picked
            const allPicked = order.items.every((item: OutboundOrderItem) =>
                (localQuantities[item.id] || 0) >= item.qtyToPick
            );

            // Determine new status
            let newStatus = order.status;
            if (allPicked && order.status !== 'ready') {
                newStatus = 'ready';
            } else if (order.status === 'open') {
                newStatus = 'picking';
            }

            await updateOrder.mutateAsync({
                id: order.id,
                updates: {
                    items: updatedItems,
                    status: newStatus,
                }
            });

            Alert.alert('Thành công', 'Đã cập nhật số lượng lấy hàng');
            router.back();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật số lượng');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaHeader showBackButton backgroundColor="#fff" style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Xuất Kho</Text>
                    <Text style={styles.headerSubtitle}>{order.outboundNumber}</Text>
                </View>
            </SafeAreaHeader>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Feather name="user" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>Khách hàng: <Text style={styles.boldText}>{order.customer}</Text></Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Feather name="map-pin" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>Giao đến: <Text style={styles.boldText}>{order.destination}</Text></Text>
                    </View>
                </Card>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Lộ trình lấy hàng tối ưu</Text>
                    <Text style={styles.sectionSubtitle}>{order.items.length} mặt hàng</Text>
                </View>

                {sortedItems.map((item: OutboundOrderItem) => (
                    <Card key={item.id} style={[styles.itemCard, verifiedItems[item.id] ? styles.itemCardVerified : null]}>
                        <View style={styles.itemHeader}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.productName}>{item.productName}</Text>
                                <View style={styles.skuRow}>
                                    <View style={styles.skuBadge}>
                                        <Text style={styles.skuText}>{item.sku}</Text>
                                    </View>
                                    {item.pickLocations.map((loc: any) => (
                                        <View key={loc.locationCode} style={styles.locationBadge}>
                                            <Feather name="layers" size={10} color={COLORS.primary} />
                                            <Text style={styles.locationText}>{loc.locationCode}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            <View style={[styles.statusBadge, {
                                backgroundColor: (localQuantities[item.id] || 0) >= item.qtyToPick ? COLORS.success + '20' : COLORS.warning + '20'
                            }]}>
                                <Text style={[styles.statusBadgeText, {
                                    color: (localQuantities[item.id] || 0) >= item.qtyToPick ? COLORS.success : COLORS.warning
                                }]}>
                                    {(localQuantities[item.id] || 0) >= item.qtyToPick ? 'Xong' : 'Chờ'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.counterRow}>
                            <View style={styles.qtyLabelContainer}>
                                <Text style={styles.qtyLabel}>Số lượng đã lấy:</Text>
                                {!verifiedItems[item.id] && (
                                    <Text style={styles.verificationPrompt}>Quét để xác minh</Text>
                                )}
                            </View>
                            <View style={[styles.counter, !verifiedItems[item.id] && styles.disabledCounter]}>
                                <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => handleUpdateQty(item.id, false)}
                                    disabled={!verifiedItems[item.id]}
                                >
                                    <Feather name="minus" size={20} color={verifiedItems[item.id] ? COLORS.primary : COLORS.border} />
                                </TouchableOpacity>
                                <View style={styles.qtyDisplay}>
                                    <Text style={[styles.qtyValue, !verifiedItems[item.id] && { color: COLORS.border }]}>
                                        {localQuantities[item.id] || 0}
                                    </Text>
                                    <Text style={styles.qtyTotal}>/ {item.qtyToPick}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => handleUpdateQty(item.id, true)}
                                    disabled={!verifiedItems[item.id]}
                                >
                                    <Feather name="plus" size={20} color={verifiedItems[item.id] ? COLORS.primary : COLORS.border} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.scanItemBtn, verifiedItems[item.id] && styles.scanItemBtnSuccess]}
                            onPress={() => handleVerifyItem(item.id)}
                            disabled={verifiedItems[item.id] || isSaving}
                        >
                            <Feather name={verifiedItems[item.id] ? "check-circle" : "maximize"} size={16} color={verifiedItems[item.id] ? COLORS.success : COLORS.primary} />
                            <Text style={[styles.scanItemBtnText, verifiedItems[item.id] && { color: COLORS.success }]}>
                                {verifiedItems[item.id] ? 'Đã xác minh sản phẩm' : 'Verify Scan (Quét mã xác nhận)'}
                            </Text>
                        </TouchableOpacity>
                    </Card>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.reportBtn}>
                    <Feather name="alert-triangle" size={20} color={COLORS.danger} />
                    <Text style={styles.reportBtnText}>Báo lỗi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.saveBtn, isSaving && styles.disabledBtn]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Text style={styles.saveBtnText}>
                        {isSaving ? 'Đang lưu...' : 'Hoàn tất lấy hàng'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#fff',
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    infoCard: {
        marginBottom: 16,
        backgroundColor: '#fff',
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    boldText: {
        fontWeight: '600',
        color: COLORS.text,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    itemCard: {
        marginBottom: 12,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    itemInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 6,
    },
    skuRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skuBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    skuText: {
        fontSize: 11,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    locationText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    qtyLabelContainer: {
        flex: 1,
    },
    qtyLabel: {
        fontSize: 14,
        color: COLORS.text,
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 4,
    },
    counterBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    qtyDisplay: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingHorizontal: 16,
        minWidth: 80,
        justifyContent: 'center',
    },
    qtyValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    qtyTotal: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginLeft: 4,
    },
    scanItemBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
        backgroundColor: COLORS.primary + '08',
    },
    scanItemBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    reportBtn: {
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.danger + '30',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.danger + '05',
    },
    reportBtnText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.danger,
        marginTop: 2,
    },
    saveBtn: {
        flex: 1,
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemCardVerified: {
        borderColor: '#059669',
        borderWidth: 1,
    },
    verificationPrompt: {
        fontSize: 11,
        color: COLORS.danger,
        fontWeight: 'bold',
        marginTop: 2,
    },
    disabledCounter: {
        opacity: 0.5,
    },
    scanItemBtnSuccess: {
        backgroundColor: '#05966910',
        borderColor: '#059669',
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    disabledBtn: {
        opacity: 0.6,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.textMuted,
        marginTop: 12,
        marginBottom: 24,
        textAlign: 'center',
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
