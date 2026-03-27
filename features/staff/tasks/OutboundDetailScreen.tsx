import { Card, ScreenHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import { useOutboundTasksByStaff, useUpdateOutboundTicketItems, useUpdateOutboundTicketStatus } from '@/hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import type { OutboundOrderItem } from '@/types/outbound-order';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// BE Status Flow (Staff allowed transitions):
// Created → Picking → QualityCheck → (IssueReported | Packing) → Packing → LoadHandover
// Manager confirms LoadHandover → Completed
// Items update only during: QualityCheck or IssueReported
type TicketStatus = 'Created' | 'Picking' | 'QualityCheck' | 'IssueReported' | 'Packing' | 'LoadHandover' | 'Completed';

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bgColor: string }> = {
    Created: { label: 'Đã tạo', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    Picking: { label: 'Đang lấy hàng', color: COLORS.primary, bgColor: COLORS.primaryLight + '20' },
    QualityCheck: { label: 'Kiểm tra chất lượng', color: '#7C3AED', bgColor: '#7C3AED20' },
    IssueReported: { label: 'Có vấn đề', color: COLORS.danger, bgColor: COLORS.danger + '20' },
    Packing: { label: 'Đóng gói', color: COLORS.teal600, bgColor: COLORS.teal50 },
    LoadHandover: { label: 'Chờ Manager xác nhận', color: COLORS.warning, bgColor: COLORS.warning + '20' },
    Completed: { label: 'Hoàn tất', color: COLORS.success, bgColor: COLORS.success + '20' },
};

// Get next staff action based on current status
const getNextAction = (status: TicketStatus): { label: string; nextStatus: TicketStatus; color: string } | null => {
    switch (status) {
        case 'Created': return { label: 'Bắt đầu lấy hàng', nextStatus: 'Picking', color: COLORS.primary };
        case 'Picking': return { label: 'Hoàn tất lấy hàng → Kiểm tra', nextStatus: 'QualityCheck', color: '#7C3AED' };
        case 'QualityCheck': return { label: 'Đạt chất lượng → Đóng gói', nextStatus: 'Packing', color: COLORS.teal600 };
        case 'IssueReported': return { label: 'Đã khắc phục → Đóng gói', nextStatus: 'Packing', color: COLORS.teal600 };
        case 'Packing': return { label: 'Đóng gói xong → Bàn giao', nextStatus: 'LoadHandover', color: COLORS.warning };
        default: return null; // LoadHandover & Completed: no staff action
    }
};

export default function OutboundDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const goBack = useAppBack();
    const user = useAuthStore((state) => state.user);
    const companyId = user?.companyId ?? 0;
    const staffId = user?.id ?? 0;

    // Lấy data từ staff task list (tránh 404 do filter companyId không nhất quán ở BE)
    const { data: staffTasks, isLoading } = useOutboundTasksByStaff(companyId, staffId);
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const order = staffTasks?.find(t => t.id === numericId) ?? null;
    const error = !isLoading && !order;

    const updateItems = useUpdateOutboundTicketItems();
    const updateStatus = useUpdateOutboundTicketStatus();

    const [localQuantities, setLocalQuantities] = useState<Record<number, number>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const currentStatus = (order?.status as TicketStatus) || 'Created';
    const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.Created;
    const nextAction = getNextAction(currentStatus);
    // BE: Items can only be updated during QualityCheck or IssueReported
    const canEditItems = currentStatus === 'QualityCheck' || currentStatus === 'IssueReported';
    // BE: IssueReported only from QualityCheck
    const canReportIssue = currentStatus === 'QualityCheck';

    // Initialize state when order data is loaded
    useEffect(() => {
        const orderItems = order?.items || order?.outboundOrderItems;
        if (orderItems) {
            const initialQty: Record<number, number> = {};
            orderItems.forEach((item: OutboundOrderItem) => {
                initialQty[item.id] = item.quantity || 0;
            });
            setLocalQuantities(initialQty);
        }
    }, [order]);

    // Sort items by product name for easier picking
    const sortedItems = React.useMemo(() => {
        const orderItems = order?.items || order?.outboundOrderItems;
        if (!orderItems) return [];
        return [...orderItems].sort((a, b) => {
            const nameA = a.productName || a.name || a.product?.name || '';
            const nameB = b.productName || b.name || b.product?.name || '';
            return nameA.localeCompare(nameB);
        });
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
                    <Text style={styles.errorText}>Không tìm thấy thông tin đơn hàng</Text>
                    <TouchableOpacity style={styles.backButton} onPress={goBack}>
                        <Text style={styles.backButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const handleUpdateQty = (itemId: number, increment: boolean) => {
        if (!canEditItems) {
            AlertService.warning('Không thể sửa', 'Chỉ được cập nhật số lượng khi đang ở bước Kiểm tra chất lượng hoặc Báo lỗi.');
            return;
        }
        setLocalQuantities(prev => {
            const current = prev[itemId] || 0;
            const orderItems = order?.items || order?.outboundOrderItems || [];
            const item = orderItems.find((i: OutboundOrderItem) => i.id === itemId);
            const maxQty = item?.quantity || 9999;
            const newValue = increment
                ? Math.min(current + 1, maxQty)
                : Math.max(current - 1, 0);
            return { ...prev, [itemId]: newValue };
        });
    };

    const handleSaveItems = async () => {
        if (!order || !canEditItems) return;
        setIsSaving(true);
        try {
            const orderItems = order.items || order.outboundOrderItems || [];
            const updatedItems = orderItems.map((item: OutboundOrderItem) => ({
                id: item.id,
                productId: item.productId || 0,
                quantity: localQuantities[item.id] || item.quantity || 0,
            }));

            await updateItems.mutateAsync({
                ticketId: order.id,
                items: updatedItems,
            });

            AlertService.success('Thành công', 'Đã cập nhật số lượng');
        } catch {
            AlertService.error('Lỗi', 'Không thể cập nhật số lượng');
        } finally {
            setIsSaving(false);
        }
    };

    // Transition to next status
    const handleTransition = async () => {
        if (!order || !user || !nextAction) return;

        const confirmMsg = nextAction.nextStatus === 'LoadHandover'
            ? 'Sau khi bàn giao, Manager sẽ xác nhận hoàn thành đơn.'
            : `Chuyển trạng thái sang "${STATUS_CONFIG[nextAction.nextStatus].label}"?`;

        AlertService.confirm(
            nextAction.label,
            confirmMsg,
            async () => {
                setIsTransitioning(true);
                try {
                    await updateStatus.mutateAsync({
                        ticketId: order.id,
                        performedBy: user.id || 0,
                        status: nextAction.nextStatus,
                    });
                    AlertService.success('Thành công', `Đã chuyển sang: ${STATUS_CONFIG[nextAction.nextStatus].label}`);
                } catch {
                    AlertService.error('Lỗi', 'Không thể cập nhật trạng thái');
                } finally {
                    setIsTransitioning(false);
                }
            }
        );
    };

    // Report issue (only from QualityCheck)
    const handleReportIssue = async () => {
        if (!order || !user || !canReportIssue) return;

        AlertService.confirm(
            'Báo lỗi',
            'Xác nhận có vấn đề với đơn hàng? Bạn có thể sửa số lượng sau khi báo lỗi.',
            async () => {
                setIsTransitioning(true);
                try {
                    await updateStatus.mutateAsync({
                        ticketId: order.id,
                        performedBy: user.id || 0,
                        status: 'IssueReported',
                    });
                    AlertService.success('Đã báo lỗi', 'Hãy cập nhật số lượng rồi chuyển tiếp.');
                } catch {
                    AlertService.error('Lỗi', 'Không thể báo lỗi');
                } finally {
                    setIsTransitioning(false);
                }
            }
        );
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Xuất Kho"
                subtitle={order.note || `OUT-${order.id}`}
            />

            <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}>
                {/* Current Status Badge */}
                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoText}>Trạng thái:</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                            <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                                {statusConfig.label}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Feather name="user" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>Người tạo: <Text style={styles.boldText}>{order.createdByUser?.fullName || order.createdByUser?.email || order.createdByNavigation?.email || 'N/A'}</Text></Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Feather name="map-pin" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>Giao đến: <Text style={styles.boldText}>{order.destination || 'N/A'}</Text></Text>
                    </View>
                    {!canEditItems && currentStatus !== 'LoadHandover' && currentStatus !== 'Completed' && (
                        <Text style={{ fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 4 }}>
                            Cập nhật số lượng chỉ khả dụng ở bước Kiểm tra CL / Báo lỗi
                        </Text>
                    )}
                </Card>

                {/* Warehouse Location Shortcut */}
                <TouchableOpacity
                    style={styles.warehouseCard}
                    onPress={() => router.push('/warehouse-view')}
                >
                    <View style={styles.warehouseIconWrap}>
                        <Feather name="map" size={18} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.warehouseTitle}>Sơ đồ kho</Text>
                        <Text style={styles.warehouseSubtitle}>Nhấn để xem vị trí trên sơ đồ</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Danh sách sản phẩm</Text>
                    <Text style={styles.sectionSubtitle}>{(order.items || order.outboundOrderItems)?.length ?? 0} mặt hàng</Text>
                </View>

                {sortedItems.map((item: OutboundOrderItem) => (
                    <Card key={item.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.productName}>{item.productName || item.name || item.product?.name || `Sản phẩm #${item.productId}`}</Text>
                                <View style={styles.skuRow}>
                                    <View style={styles.skuBadge}>
                                        <Text style={styles.skuText}>{item.sku || item.product?.sku || 'N/A'}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={[styles.statusBadge, {
                                backgroundColor: (localQuantities[item.id] || 0) >= (item.quantity || 0) ? COLORS.success + '20' : COLORS.warning + '20'
                            }]}>
                                <Text style={[styles.statusBadgeText, {
                                    color: (localQuantities[item.id] || 0) >= (item.quantity || 0) ? COLORS.success : COLORS.warning
                                }]}>
                                    {(localQuantities[item.id] || 0) >= (item.quantity || 0) ? 'Xong' : 'Chờ'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.counterRow}>
                            <Text style={styles.qtyLabel}>Số lượng đã lấy:</Text>
                            {canEditItems ? (
                                <View style={styles.counter}>
                                    <TouchableOpacity
                                        style={styles.counterBtn}
                                        onPress={() => handleUpdateQty(item.id, false)}
                                    >
                                        <Feather name="minus" size={20} color={COLORS.primary} />
                                    </TouchableOpacity>
                                    <View style={styles.qtyDisplay}>
                                        <Text style={styles.qtyValue}>{localQuantities[item.id] || 0}</Text>
                                        <Text style={styles.qtyTotal}>/ {item.quantity || 0}</Text>
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
                                    <Text style={[styles.qtyValue, currentStatus === 'Completed' && { color: COLORS.success }]}>{item.quantity || 0}</Text>
                                    <Text style={styles.qtyTotal}>/ {item.quantity || 0}</Text>
                                </View>
                            )}
                        </View>


                    </Card>
                ))}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: getBottomSafePadding(insets.bottom, 20) }]}>
                {/* Report Issue button - only during QualityCheck */}
                {canReportIssue && (
                    <TouchableOpacity
                        style={styles.reportBtn}
                        onPress={handleReportIssue}
                        disabled={isTransitioning}
                    >
                        <Feather name="alert-triangle" size={20} color={COLORS.danger} />
                        <Text style={styles.reportBtnText}>Báo lỗi</Text>
                    </TouchableOpacity>
                )}

                {/* Save items - only during QualityCheck/IssueReported */}
                {canEditItems && (
                    <TouchableOpacity
                        style={[styles.saveBtn, isSaving && styles.disabledBtn]}
                        onPress={handleSaveItems}
                        disabled={isSaving}
                    >
                        <Text style={styles.saveBtnText}>
                            {isSaving ? 'Đang lưu...' : 'Lưu số lượng'}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Next status transition button */}
                {nextAction && (
                    <TouchableOpacity
                        style={[styles.confirmBtn, { backgroundColor: nextAction.color }, isTransitioning && styles.disabledBtn]}
                        onPress={handleTransition}
                        disabled={isTransitioning}
                    >
                        <Feather name="arrow-right-circle" size={20} color="#fff" />
                        <Text style={styles.confirmBtnText}>
                            {isTransitioning ? 'Đang xử lý...' : nextAction.label}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* LoadHandover / Completed: Read-only info */}
                {currentStatus === 'LoadHandover' && (
                    <View style={[styles.confirmBtn, { backgroundColor: COLORS.warning }]}>
                        <Feather name="clock" size={20} color="#fff" />
                        <Text style={styles.confirmBtnText}>Chờ Manager xác nhận</Text>
                    </View>
                )}
                {currentStatus === 'Completed' && (
                    <View style={styles.completedBanner}>
                        <Feather name="check-circle" size={20} color={COLORS.success} />
                        <Text style={styles.completedBannerText}>Đơn xuất kho đã hoàn tất</Text>
                    </View>
                )}
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
    priceRow: {
        flexDirection: 'row',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    priceText: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    completedBanner: {
        flex: 1,
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
});
