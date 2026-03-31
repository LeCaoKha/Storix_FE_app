import { Card, RefreshContainer, ScreenHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import { useInboundOrdersByStaff, useInboundStorageRecommendations, useUpdateInboundTicketItems } from '@/hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { useWarehouseStructure } from '@/hooks/warehouse.hooks';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import type { InboundItemStorageRecommendations, InboundOrderItem } from '@/types/inbound-order';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InboundDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const goBack = useAppBack();
    const user = useAuthStore((state) => state.user);
    const companyId = user?.companyId ?? 0;
    const staffId = user?.id ?? 0;

    // Dùng endpoint staff-specific (filter theo Warehouse.CompanyId — đúng)
    // thay vì GET /tickets/{companyId}/{id} (filter theo CreatedByNavigation.CompanyId — sai, gây 404)
    const { data: staffOrders, isLoading, refetch: refetchOrders } = useInboundOrdersByStaff(companyId, staffId);
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    const order = useMemo(() => staffOrders?.find(t => t.id === numericId) ?? null, [staffOrders, numericId]);
    const error = !isLoading && !order;
    const { data: recommendationItems = [], isLoading: recommendationsLoading, refetch: refetchRecs } = useInboundStorageRecommendations(order?.id);

    const updateItems = useUpdateInboundTicketItems();
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

    const warehouseId = useMemo(() => order?.warehouse?.id || order?.warehouseId, [order]);
    const { data: warehouseStructure, refetch: refetchStructure } = useWarehouseStructure(warehouseId);

    const validBinCodes = useMemo(() => {
        if (!warehouseStructure?.zones) return new Set<string>();

        const bins = warehouseStructure.zones.flatMap((zone) =>
            (zone.shelves || []).flatMap((shelf) =>
                (shelf.levels || []).flatMap((level) =>
                    (level.bins || []).flatMap((bin) => [bin.code, bin.id].filter(Boolean) as string[])
                )
            )
        );

        return new Set(bins.map((code) => code.trim()).filter(Boolean));
    }, [warehouseStructure]);

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
                warehouseId: String(order?.warehouse?.id || order?.warehouseId || ''),
                inboundOrderId: String(order?.id || ''),
                focusedBins: bins.join(','),
                focusedItemId: String(item.id),
                focusedItemName: item.name || item.product?.name || `SP #${item.productId}`,
            },
        } as any);
    };

    const [localQuantities, setLocalQuantities] = useState<Record<number, number>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initialize receivedQuantity from existing data
    useEffect(() => {
        if (order?.inboundOrderItems) {
            setLocalQuantities(
                order.inboundOrderItems.reduce((acc: Record<number, number>, item: InboundOrderItem) => ({ ...acc, [item.id]: item.receivedQuantity || 0 }), {})
            );
            setHasUnsavedChanges(false);
        }
    }, [order]);

    useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, []);

    // Keep status flags before any early return to preserve hook call order.
    const isCompleted = order?.status === 'Completed';
    const isPartiallyCompleted = order?.status === 'Partially Completed';
    const canEdit = !!order && !isCompleted;

    useEffect(() => {
        if (!order || !canEdit || !hasUnsavedChanges || isSaving || isConfirming) return;

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(async () => {
            if (!order || isSaving || isConfirming) return;

            setIsAutoSaving(true);
            try {
                const updatedItems = order.inboundOrderItems.map((item: InboundOrderItem) => {
                    const topRecommendation = recommendationByItemId.get(item.id)?.storageRecommendations?.[0];
                    const quantity = localQuantities[item.id] || item.receivedQuantity || 0;
                    const recommendedBin = topRecommendation?.binIdCode;
                    const canUseRecommendationBin = !!recommendedBin && validBinCodes.has(recommendedBin);

                    return {
                        id: item.id,
                        productId: item.productId || 0,
                        expectedQuantity: item.expectedQuantity,
                        receivedQuantity: quantity,
                        locations: canUseRecommendationBin && quantity > 0
                            ? [{ binId: recommendedBin as string, quantity }]
                            : undefined,
                    };
                });

                await updateItems.mutateAsync({
                    ticketId: order.id,
                    items: updatedItems,
                });

                setHasUnsavedChanges(false);
            } catch {
                // Keep unsaved flag so user can retry by manual save.
            } finally {
                setIsAutoSaving(false);
            }
        }, 800);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [
        canEdit,
        hasUnsavedChanges,
        isConfirming,
        isSaving,
        localQuantities,
        order,
        recommendationByItemId,
        updateItems,
        validBinCodes,
    ]);

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
                    <Text style={styles.errorText}>Không tìm thấy thông tin đơn hàng</Text>
                    <TouchableOpacity style={styles.backButton} onPress={goBack}>
                        <Text style={styles.backButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const handleUpdateQty = (itemId: number, increment: boolean) => {
        if (!canEdit) return;
        setLocalQuantities(prev => {
            const current = prev[itemId] || 0;
            const item = order?.inboundOrderItems.find((i: InboundOrderItem) => i.id === itemId);
            const newValue = increment
                ? Math.min(current + 1, item?.expectedQuantity || 9999)
                : Math.max(current - 1, 0);
            return { ...prev, [itemId]: newValue };
        });
        setHasUnsavedChanges(true);
    };



    const handleSave = async () => {
        if (!order) return;
        setIsSaving(true);
        try {
            // Update items with received quantities
            const updatedItems = order.inboundOrderItems.map((item: InboundOrderItem) => {
                const topRecommendation = recommendationByItemId.get(item.id)?.storageRecommendations?.[0];
                const quantity = localQuantities[item.id] || item.receivedQuantity || 0;
                const recommendedBin = topRecommendation?.binIdCode;
                const canUseRecommendationBin = !!recommendedBin && validBinCodes.has(recommendedBin);

                return {
                    id: item.id,
                    productId: item.productId || 0,
                    expectedQuantity: item.expectedQuantity,
                    receivedQuantity: quantity,
                    locations: canUseRecommendationBin && quantity > 0
                        ? [{ binId: recommendedBin as string, quantity }]
                        : undefined,
                };
            });

            await updateItems.mutateAsync({
                ticketId: order.id,
                items: updatedItems,
            });

            AlertService.success('Thành công', 'Đã lưu thông tin nhận hàng');
        } catch {
            AlertService.error('Lỗi', 'Không thể cập nhật số lượng');
        } finally {
            setIsSaving(false);
        }
    };

    // Check if all items are received
    const allItemsReceived = order?.inboundOrderItems?.every(
        (item: InboundOrderItem) => (localQuantities[item.id] || 0) >= (item.expectedQuantity || 0)
    ) ?? false;

    const handleConfirmComplete = async () => {
        if (!order || !user) return;

        AlertService.confirm(
            'Xác nhận hoàn tất nhập kho',
            'Bạn có chắc chắn đã nhận đủ và kiểm tra tất cả hàng hóa? Sau khi xác nhận, phiếu nhập sẽ được đánh dấu hoàn thành.',
            async () => {
                setIsConfirming(true);
                try {
                    // Update items with final quantities
                    const updatedItems = order.inboundOrderItems.map((item: InboundOrderItem) => {
                        const topRecommendation = recommendationByItemId.get(item.id)?.storageRecommendations?.[0];
                        const quantity = localQuantities[item.id] || item.receivedQuantity || 0;
                        const recommendedBin = topRecommendation?.binIdCode;
                        const canUseRecommendationBin = !!recommendedBin && validBinCodes.has(recommendedBin);

                        return {
                            id: item.id,
                            productId: item.productId || 0,
                            expectedQuantity: item.expectedQuantity,
                            receivedQuantity: quantity,
                            locations: canUseRecommendationBin && quantity > 0
                                ? [{ binId: recommendedBin as string, quantity }]
                                : undefined,
                        };
                    });

                    await updateItems.mutateAsync({
                        ticketId: order.id,
                        items: updatedItems,
                    });

                    // Update ticket status to Completed (assuming Backend supports this)
                    // ... call status update API if available

                    AlertService.success('Hoàn thành', 'Phiếu nhập kho đã được xác nhận hoàn tất. Hàng hóa đã được ghi nhận vào tồn kho.', () => {
                        goBack();
                    });
                } catch {
                    AlertService.error('Lỗi', 'Không thể xác nhận hoàn tất. Vui lòng thử lại.');
                } finally {
                    setIsConfirming(false);
                }
            }
        );
    };

    const handleRefresh = async () => {
        await Promise.all([
            refetchOrders(),
            refetchRecs(),
            refetchStructure()
        ]);
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Nhập Kho"
                subtitle={order.referenceCode || `INB-${order.id}`}
            />

            <RefreshContainer 
                style={styles.content} 
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
                onRefresh={handleRefresh}
            >
                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Feather name="truck" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>Nhà cung cấp: <Text style={styles.boldText}>{order.supplier?.name || 'N/A'}</Text></Text>
                    </View>
                    {order.referenceCode && (
                        <View style={styles.infoRow}>
                            <Feather name="file-text" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoText}>Mã tham chiếu: <Text style={styles.boldText}>{order.referenceCode}</Text></Text>
                        </View>
                    )}
                </Card>

                <Card style={styles.recommendationCard}>
                    <View style={styles.recommendationHeader}>
                        <Feather name="map-pin" size={16} color={COLORS.primary} />
                        <Text style={styles.recommendationTitle}>Gợi ý xếp hàng sau nhập kho</Text>
                    </View>

                    {recommendationsLoading ? (
                        <Text style={styles.recommendationSubtle}>Đang tải gợi ý vị trí...</Text>
                    ) : recommendedBinCodes.length === 0 ? (
                        <Text style={styles.recommendationSubtle}>Chưa có gợi ý từ hệ thống. Staff có thể tự chọn vị trí xếp hàng.</Text>
                    ) : (
                        <>
                            {order.inboundOrderItems.map((item: InboundOrderItem) => {
                                const topRecommendation = recommendationByItemId.get(item.id)?.storageRecommendations?.[0];
                                if (!topRecommendation?.binIdCode) return null;

                                return (
                                    <View key={`inbound-recommendation-${item.id}`} style={styles.recommendationItem}>
                                        <Text style={styles.recommendationProduct} numberOfLines={1}>
                                            {item.name || item.product?.name || `SP #${item.productId}`}
                                        </Text>
                                        <Text style={styles.recommendationBin}>{topRecommendation.binIdCode}</Text>
                                    </View>
                                );
                            })}
                        </>
                    )}
                </Card>

                {/* Warehouse Location Shortcut */}
                <TouchableOpacity
                    style={styles.warehouseCard}
                    onPress={() => router.push({
                        pathname: '/warehouse-view',
                        params: {
                            warehouseId: String(order.warehouse?.id || order.warehouseId || ''),
                            inboundOrderId: String(order.id),
                            recommendedBins: recommendedBinCodes.join(','),
                        },
                    } as any)}
                >
                    <View style={styles.warehouseIconWrap}>
                        <Feather name="map" size={18} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.warehouseTitle}>Sơ đồ kho</Text>
                        <Text style={styles.warehouseSubtitle}>Nhấn để xem vị trí đề xuất trên sơ đồ</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Danh sách sản phẩm</Text>
                    <Text style={styles.sectionSubtitle}>{order.inboundOrderItems.length} mặt hàng</Text>
                </View>

                {order.inboundOrderItems.map((item: InboundOrderItem) => (
                    <Card key={item.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.productName}>{item.name || item.product?.name || `Sản phẩm #${item.productId}`}</Text>
                                <Text style={styles.skuText}>SKU: {item.sku || item.product?.sku || 'N/A'}</Text>
                            </View>
                            <View style={[styles.statusBadge, {
                                backgroundColor: (isCompleted || (localQuantities[item.id] || 0) >= (item.expectedQuantity || 0)) ? COLORS.success + '20' : COLORS.warning + '20'
                            }]}>
                                <Text style={[styles.statusBadgeText, {
                                    color: (isCompleted || (localQuantities[item.id] || 0) >= (item.expectedQuantity || 0)) ? COLORS.success : COLORS.warning
                                }]}>
                                    {(isCompleted || (localQuantities[item.id] || 0) >= (item.expectedQuantity || 0)) ? 'Đủ' : 'Chờ'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.counterRow}>
                            <Text style={styles.qtyLabel}>Số lượng đã nhận:</Text>
                            {canEdit ? (
                                <View style={styles.counter}>
                                    <TouchableOpacity
                                        style={styles.counterBtn}
                                        onPress={() => handleUpdateQty(item.id, false)}
                                    >
                                        <Feather name="minus" size={20} color={COLORS.primary} />
                                    </TouchableOpacity>
                                    <View style={styles.qtyDisplay}>
                                        <Text style={styles.qtyValue}>{localQuantities[item.id] || 0}</Text>
                                        <Text style={styles.qtyTotal}>/ {item.expectedQuantity || 0}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.counterBtn}
                                        onPress={() => handleUpdateQty(item.id, true)}
                                    >
                                        <Feather name="plus" size={20} color={COLORS.primary} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.qtyDisplay}>
                                    <Text style={[styles.qtyValue, isCompleted && { color: COLORS.success }]}>
                                        {isCompleted
                                            ? (item.receivedQuantity || item.expectedQuantity || 0)
                                            : (item.receivedQuantity || 0)}
                                    </Text>
                                    <Text style={styles.qtyTotal}>/ {item.expectedQuantity || 0}</Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.itemActionButton}
                            onPress={() => openWarehouseForItem(item)}
                        >
                            <Feather name="map-pin" size={14} color={COLORS.primary} />
                            <Text style={styles.itemActionText}>Xem kệ cần xếp cho sản phẩm này</Text>
                        </TouchableOpacity>


                    </Card>
                ))}
            </RefreshContainer>

            {isCompleted ? (
                <View style={[styles.footer, { paddingBottom: getBottomSafePadding(insets.bottom, 20) }]}>
                    <View style={[styles.completedBanner, { flex: 1 }]}>
                        <Feather name="check-circle" size={20} color={COLORS.success} />
                        <Text style={styles.completedBannerText}>Đơn nhập kho đã hoàn tất</Text>
                    </View>
                </View>
            ) : (
                <View style={[styles.footer, { paddingBottom: getBottomSafePadding(insets.bottom, 20) }]}>
                    <TouchableOpacity style={[styles.reportBtn, { opacity: 0.6 }]} disabled={true}>
                        <Feather name="alert-triangle" size={20} color={COLORS.danger} />
                        <Text style={styles.reportBtnText}>Báo lỗi</Text>
                    </TouchableOpacity>

                    {!allItemsReceived ? (
                        <TouchableOpacity
                            style={[styles.saveBtn, (isSaving || isAutoSaving) && styles.disabledBtn]}
                            onPress={handleSave}
                            disabled={isSaving || isAutoSaving}
                        >
                            <Text style={styles.saveBtnText}>
                                {isSaving ? 'Đang lưu...' : isAutoSaving ? 'Tự động lưu...' : 'Lưu tiến độ'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.confirmBtn, isConfirming && styles.disabledBtn]}
                            onPress={handleConfirmComplete}
                            disabled={isConfirming}
                        >
                            <Feather name="check-circle" size={20} color="#fff" />
                            <Text style={styles.confirmBtnText}>
                                {isConfirming ? 'Đang xử lý...' : 'Xác nhận hoàn tất'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
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
        marginBottom: 20,
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
        marginBottom: 4,
    },
    skuText: {
        fontSize: 12,
        color: COLORS.textMuted,
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
    itemActionButton: {
        marginTop: 10,
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
    businessLogicSection: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dataGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    dataField: {
        flex: 1,
    },
    dataLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: 6,
    },
    dataInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 13,
        color: COLORS.text,
    },
    qcOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    qcOption: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    qcOptionActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    qcOptionActiveDanger: {
        borderColor: COLORS.danger,
        backgroundColor: COLORS.danger + '10',
    },
    qcOptionText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    qcOptionTextActive: {
        color: COLORS.primary,
    },
    qcOptionTextActiveDanger: {
        color: COLORS.danger,
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
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textLight,
    },
    confirmBtn: {
        flex: 1,
        height: 56,
        backgroundColor: COLORS.success,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmBtnText: {
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
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    priceText: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    discountText: {
        fontSize: 13,
        color: COLORS.success,
        fontWeight: '600',
    },
    completedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 56,
        backgroundColor: COLORS.success + '15',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.success + '30',
    },
    completedBannerText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.success,
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
        marginBottom: 12,
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
});
