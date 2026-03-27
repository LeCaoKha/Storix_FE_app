import { Card, ScreenHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import { useInboundOrdersByStaff, useInboundStorageRecommendations, useUpdateInboundTicketItems } from '@/hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import type { InboundItemStorageRecommendations, InboundOrderItem } from '@/types/inbound-order';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PutawayDetailScreen() {
    const router = useRouter();
    const goBack = useAppBack();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const user = useAuthStore((state) => state.user);
    const companyId = user?.companyId ?? 0;
    const staffId = user?.id ?? 0;

    const { data: staffOrders, isLoading } = useInboundOrdersByStaff(companyId, staffId);
    const updateItems = useUpdateInboundTicketItems();
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    const order = useMemo(() => staffOrders?.find((t) => t.id === numericId) ?? null, [staffOrders, numericId]);
    const error = !isLoading && !order;
    const { data: recommendationItems = [], isLoading: recommendationsLoading } = useInboundStorageRecommendations(order?.id);

    const [isProcessing, setIsProcessing] = useState(false);
    const [scannedLocation, setScannedLocation] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [localQuantities, setLocalQuantities] = useState<Record<number, number>>({});
    const [placedItems, setPlacedItems] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (order?.inboundOrderItems) {
            const initial: Record<number, number> = {};
            const initialPlaced: Record<number, boolean> = {};
            order.inboundOrderItems.forEach((item) => {
                initial[item.id] = item.receivedQuantity || item.expectedQuantity || 0;
                initialPlaced[item.id] = false;
            });
            setLocalQuantities(initial);
            setPlacedItems(initialPlaced);
        }
    }, [order]);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Đang tải..." />
            </View>
        );
    }

    if (!order || error) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Lỗi" />
                <View style={styles.centered}>
                    <Feather name="alert-circle" size={48} color={COLORS.danger} />
                    <Text style={styles.errorText}>Không tìm thấy đơn putaway</Text>
                    <TouchableOpacity style={styles.backButton} onPress={goBack}>
                        <Text style={styles.backButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const targetLocation = `WH-${order.warehouse?.id || order.warehouseId || 'NA'}-INB-${order.id}`;
    const items = order.inboundOrderItems || [];
    const recommendationByItemId = useMemo(() => {
        const map = new Map<number, InboundItemStorageRecommendations>();
        recommendationItems.forEach((item) => {
            map.set(item.inboundOrderItemId, item);
        });
        return map;
    }, [recommendationItems]);

    const recommendedBinCodes = useMemo(() => {
        const bins = recommendationItems
            .flatMap((item) => item.storageRecommendations || [])
            .map((recommendation) => recommendation.binIdCode)
            .filter((binCode): binCode is string => !!binCode);
        return Array.from(new Set(bins));
    }, [recommendationItems]);

    const openWarehouseWithRecommendations = () => {
        router.push({
            pathname: '/warehouse-view',
            params: {
                warehouseId: String(order.warehouse?.id || order.warehouseId || ''),
                inboundOrderId: String(order.id),
                recommendedBins: recommendedBinCodes.join(','),
            },
        } as any);
    };

    const openWarehouseForItem = (item: InboundOrderItem) => {
        const bins = recommendationByItemId
            .get(item.id)
            ?.storageRecommendations
            ?.map((recommendation) => recommendation.binIdCode)
            .filter((binCode): binCode is string => !!binCode) || [];

        if (bins.length === 0) {
            AlertService.warning('Chưa có gợi ý', 'Sản phẩm này chưa có vị trí gợi ý từ hệ thống.');
            return;
        }

        router.push({
            pathname: '/warehouse-view',
            params: {
                warehouseId: String(order.warehouse?.id || order.warehouseId || ''),
                inboundOrderId: String(order.id),
                focusedBins: bins.join(','),
                focusedItemName: item.name || item.product?.name || `SP #${item.productId}`,
            },
        } as any);
    };

    const togglePlacedItem = (itemId: number) => {
        setPlacedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const handleScanLocation = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setScannedLocation(targetLocation);
            AlertService.success('Thành công', 'Đã quét mã vị trí ' + targetLocation);
        }, 800);
    };

    const handleConfirm = () => {
        if (scannedLocation === targetLocation) {
            setIsVerified(true);
            AlertService.success('Thành công', 'Đã xác nhận đúng vị trí ' + targetLocation);
        } else {
            AlertService.warning('Lưu ý', 'Vị trí quét không khớp. Vui lòng thử lại.');
            setIsVerified(false);
        }
    };

    const handleComplete = async () => {
        if (!isVerified) {
            AlertService.warning('Lưu ý', 'Vui lòng xác nhận đúng vị trí trước khi hoàn thành');
            return;
        }

        const allPlaced = items.length > 0 && items.every((item) => placedItems[item.id]);
        if (!allPlaced) {
            AlertService.warning('Lưu ý', 'Vui lòng tick đã xếp xong cho tất cả sản phẩm trước khi hoàn thành.');
            return;
        }

        setIsCompleting(true);
        try {
            const updatedItems = items.map((item: InboundOrderItem) => {
                const topRecommendation = recommendationByItemId.get(item.id)?.storageRecommendations?.[0];
                const quantity = localQuantities[item.id] || item.receivedQuantity || 0;

                return {
                id: item.id,
                productId: item.productId || 0,
                expectedQuantity: item.expectedQuantity,
                receivedQuantity: quantity,
                locations: topRecommendation?.binIdCode && quantity > 0
                    ? [{ binId: topRecommendation.binIdCode, quantity }]
                    : undefined,
                };
            });

            await updateItems.mutateAsync({
                ticketId: order.id,
                items: updatedItems,
            });

            AlertService.success('Thành công', 'Đã cập nhật putaway cho đơn ' + (order.referenceCode || `INB-${order.id}`), () => {
                goBack();
            });
        } catch {
            AlertService.error('Lỗi', 'Không thể cập nhật putaway. Vui lòng thử lại.');
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Xếp hàng (Putaway)"
                subtitle={order.referenceCode || `PUT-${order.id}`}
            />

            <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}>
                <View style={styles.placeholderNotice}>
                    <Feather name="info" size={16} color="#854d0e" />
                    <Text style={styles.placeholderNoticeText}>Đang dùng inbound ticket thật cho putaway. Khi backend có endpoint putaway riêng, app sẽ chuyển sang endpoint đó.</Text>
                </View>

                <Card style={styles.infoCard}>
                    <View style={styles.locationRow}>
                        <View style={styles.locationBox}>
                            <Text style={styles.locationLabel}>Từ khu vực</Text>
                            <Text style={styles.locationValue}>{order.warehouse?.name || 'Kho'}</Text>
                        </View>
                        <Feather name="arrow-right" size={20} color={COLORS.textMuted} />
                        <View style={styles.locationBox}>
                            <Text style={styles.locationLabel}>Đến vị trí</Text>
                            <Text style={[styles.locationValue, isVerified && { color: '#059669' }]}>{targetLocation}</Text>
                        </View>
                    </View>
                </Card>

                {/* Warehouse Location Shortcut */}
                <TouchableOpacity
                    style={styles.warehouseCard}
                    onPress={openWarehouseWithRecommendations}
                >
                    <View style={styles.warehouseIconWrap}>
                        <Feather name="map" size={18} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.warehouseTitle}>Sơ đồ kho</Text>
                        <Text style={styles.warehouseSubtitle}>Nhấn để xem vị trí và gợi ý xếp hàng</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>

                <Card style={styles.recommendationCard}>
                    <View style={styles.recommendationHeader}>
                        <Feather name="map-pin" size={16} color={COLORS.primary} />
                        <Text style={styles.recommendationTitle}>Gợi ý xếp hàng vào kho</Text>
                    </View>

                    {recommendationsLoading ? (
                        <Text style={styles.recommendationSubtle}>Đang tải gợi ý vị trí...</Text>
                    ) : recommendedBinCodes.length === 0 ? (
                        <Text style={styles.recommendationSubtle}>Chưa có gợi ý từ hệ thống. Staff vẫn có thể xếp hàng thủ công.</Text>
                    ) : (
                        <>
                            {items.map((item: InboundOrderItem) => {
                                const topRecommendation = recommendationByItemId.get(item.id)?.storageRecommendations?.[0];
                                if (!topRecommendation?.binIdCode) return null;

                                return (
                                    <View key={`recommendation-${item.id}`} style={styles.recommendationItem}>
                                        <Text style={styles.recommendationProduct} numberOfLines={1}>
                                            {item.name || item.product?.name || `SP #${item.productId}`}
                                        </Text>
                                        <Text style={styles.recommendationBin}>{topRecommendation.binIdCode}</Text>
                                    </View>
                                );
                            })}

                            <TouchableOpacity style={styles.recommendationAction} onPress={openWarehouseWithRecommendations}>
                                <Feather name="navigation" size={16} color="#fff" />
                                <Text style={styles.recommendationActionText}>Mở sơ đồ kho theo gợi ý</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </Card>


                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Sản phẩm cần xếp ({items.length})</Text>
                </View>

                {items.map((item: InboundOrderItem) => (
                    <Card key={item.id} style={styles.itemCard}>
                        <View style={styles.itemInfo}>
                            <Text style={styles.productName}>{item.name || item.product?.name || `Sản phẩm #${item.productId}`}</Text>
                            <Text style={styles.skuText}>SKU: {item.sku || item.product?.sku || 'N/A'}</Text>
                        </View>
                        <View style={styles.qtyContainer}>
                            <Text style={styles.qtyValue}>{localQuantities[item.id] || item.receivedQuantity || item.expectedQuantity || 0}</Text>
                            <Text style={styles.qtyLabel}>món</Text>
                        </View>

                        <View style={styles.itemActions}>
                            <TouchableOpacity
                                style={styles.itemActionButton}
                                onPress={() => openWarehouseForItem(item)}
                            >
                                <Feather name="map-pin" size={14} color={COLORS.primary} />
                                <Text style={styles.itemActionText}>Xem kệ cần xếp</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.itemCheckButton, placedItems[item.id] && styles.itemCheckButtonActive]}
                                onPress={() => togglePlacedItem(item.id)}
                            >
                                <Feather name={placedItems[item.id] ? 'check-square' : 'square'} size={16} color={placedItems[item.id] ? '#059669' : COLORS.textMuted} />
                                <Text style={[styles.itemCheckText, placedItems[item.id] && styles.itemCheckTextActive]}>Đã xếp xong</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                ))}

                <TouchableOpacity
                    style={[styles.scanLocationBtn, isVerified && styles.scanLocationBtnSuccess]}
                    onPress={handleScanLocation}
                    disabled={isVerified || isProcessing}
                >
                    <Feather name={isVerified ? "check-circle" : "maximize"} size={20} color={isVerified ? "#059669" : COLORS.primary} />
                    <Text style={[styles.scanLocationText, isVerified && { color: '#059669' }]}>
                        {isVerified ? "Đã quét vị trí khớp" : "Quét mã vị trí đích (Rack/Bin)"}
                    </Text>
                </TouchableOpacity>

                {!isVerified && scannedLocation !== '' && (
                    <TouchableOpacity
                        style={[styles.completeBtn, { marginTop: 12, backgroundColor: COLORS.warning }]}
                        onPress={handleConfirm}
                    >
                        <Text style={styles.completeBtnText}>Xác nhận vị trí này</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: getBottomSafePadding(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={[
                        styles.completeBtn,
                        (isCompleting || !isVerified || !items.every((item) => placedItems[item.id])) && styles.disabledBtn
                    ]}
                    onPress={handleComplete}
                    disabled={isCompleting || !isVerified || !items.every((item) => placedItems[item.id])}
                >
                    <Text style={styles.completeBtnText}>
                        {isCompleting ? 'Đang xử lý...' : 'Xác nhận đã xếp hàng'}
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.text,
        marginTop: 12,
        marginBottom: 12,
    },
    backButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: '600',
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
        marginBottom: 24,
        backgroundColor: '#fff',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    locationBox: {
        flex: 1,
        alignItems: 'center',
    },
    locationLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    locationValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    sectionHeader: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    itemCard: {
        marginBottom: 12,
        backgroundColor: '#fff',
        padding: 16,
    },
    itemInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    skuText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    qtyContainer: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    qtyValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    qtyLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    itemActions: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 10,
    },
    itemActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 10,
        paddingVertical: 10,
        backgroundColor: COLORS.primary + '10',
    },
    itemActionText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '700',
    },
    itemCheckButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    itemCheckButtonActive: {
        borderColor: '#059669',
        backgroundColor: '#ECFDF5',
    },
    itemCheckText: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '700',
    },
    itemCheckTextActive: {
        color: '#059669',
    },
    scanLocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: COLORS.primary + '10',
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 20,
    },
    scanLocationBtnSuccess: {
        backgroundColor: '#05966910',
        borderColor: '#059669',
        borderStyle: 'solid',
    },
    scanLocationText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    completeBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    completeBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledBtn: {
        opacity: 0.6,
    },
    placeholderNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fefce8',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#fef08a',
    },
    placeholderNoticeText: {
        fontSize: 13,
        color: '#854d0e',
        flex: 1,
    },
    warehouseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 0,
        marginBottom: 16,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    warehouseIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    warehouseTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.slate800,
    },
    warehouseSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    recommendationCard: {
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    recommendationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    recommendationTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    recommendationSubtle: {
        fontSize: 13,
        color: COLORS.textMuted,
        lineHeight: 18,
    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    recommendationProduct: {
        flex: 1,
        marginRight: 10,
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '600',
    },
    recommendationBin: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '700',
        backgroundColor: COLORS.primary + '12',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    recommendationAction: {
        marginTop: 12,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    recommendationActionText: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '700',
    },
});
