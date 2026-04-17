import { Card, RefreshContainer, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useStockCountTicket, useUpdateStockCountItem } from '@/hooks/stock-count.hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import type { StockCountItem } from '@/types/stock-count';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InventoryCountDetailScreen() {
    const router = useRouter();
    const goBack = useAppBack();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const ticketId = parseInt(id || '0');
    const user = useAuthStore((state) => state.user);
    const companyId = user?.companyId ?? 0;

    const { data: ticket, isLoading, error, refetch } = useStockCountTicket(ticketId, companyId);
    const updateItem = useUpdateStockCountItem();

    const [counts, setCounts] = useState<Record<number, string>>({});
    const [revealedItems, setRevealedItems] = useState<Record<number, boolean>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [editingItems, setEditingItems] = useState<Record<number, boolean>>({});

    const handleCountChange = (itemId: number, value: string) => {
        const cleanValue = value.replace(/[^0-9]/g, '');
        setCounts(prev => ({ ...prev, [itemId]: cleanValue }));
    };

    const handleConfirmItem = async (item: StockCountItem) => {
        const countStr = counts[item.id] || '';
        if (countStr === '') {
            AlertService.warning('Lưu ý', 'Vui lòng nhập số lượng trước khi xác nhận');
            return;
        }

        const count = parseInt(countStr);
        setIsProcessing(true);

        try {
            if (!ticket) return;
            await updateItem.mutateAsync({
                ticketId: ticket.id,
                performedBy: user?.id ?? 0,
                itemId: item.id,
                payload: {
                    countedQuantity: count,
                }
            });

            setRevealedItems(prev => ({ ...prev, [item.id]: true }));
            setEditingItems(prev => ({ ...prev, [item.id]: false }));

            const diff = Math.abs(count - item.systemQuantity);
            if (diff > item.systemQuantity * 0.2) {
                AlertService.warning(
                    'Cảnh báo sai lệch lớn',
                    `Số lượng đếm (${count}) lệch quá 20% so với hệ thống (${item.systemQuantity}). Vui lòng kiểm tra lại.`
                );
            }
        } catch (err: any) {
            console.error('Failed to update count:', err);
            const errorMessage = err.response?.data?.message || 'Không thể cập nhật số lượng. Vui lòng thử lại.';
            AlertService.error('Lỗi kiểm kê', errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEditItem = (itemId: number) => {
        setEditingItems(prev => ({ ...prev, [itemId]: true }));
    };

    const handleRefresh = async () => {
        await refetch();
    };

    const focusedBinsString = useMemo(() => {
        if (!ticket) return '';
        return ticket.items
            .map(item => item.locationId)
            .filter((id): id is number => !!id)
            .join(',');
    }, [ticket]);

    const openWarehouseForTicket = () => {
        if (!ticket) return;
        router.push({
            pathname: '/warehouse-view',
            params: {
                warehouseId: String(ticket.warehouseId || ''),
                inventoryCountTicketId: String(ticket.id),
                focusedBins: focusedBinsString,
            },
        } as any);
    };

    const openWarehouseForItem = (item: StockCountItem) => {
        if (!ticket) return;
        router.push({
            pathname: '/warehouse-view',
            params: {
                warehouseId: String(ticket.warehouseId || ''),
                inventoryCountTicketId: String(ticket.id),
                focusedBins: String(item.locationId || ''),
                focusedItemId: String(item.productId),
                focusedItemName: item.name || `SP #${item.productId}`,
            },
        } as any);
    };

    const isTicketFinished = ticket?.status?.toLowerCase() === 'finished';

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải chi tiết phiếu kiểm kê...</Text>
            </View>
        );
    }

    if (error || !ticket) {
        return (
            <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={48} color={COLORS.danger} />
                <Text style={styles.errorText}>Không thể tải thông tin phiếu kiểm kê</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={goBack}>
                    <Text style={styles.retryBtnText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Kiểm kê hàng hóa"
                subtitle={ticket.name || `CNT-${ticket.id}`}
            />

            <RefreshContainer 
                style={styles.content} 
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]} 
                showsVerticalScrollIndicator={false}
                onRefresh={handleRefresh}
            >
                <Card style={styles.infoCard}>
                    <View style={styles.statusSection}>
                        <View style={[styles.statusBadge, { 
                            backgroundColor: isTicketFinished ? COLORS.success + '20' : COLORS.warning + '20' 
                        }]}>
                            <View style={[styles.statusDot, { 
                                backgroundColor: isTicketFinished ? COLORS.success : COLORS.warning 
                            }]} />
                            <Text style={[styles.statusBadgeText, { 
                                color: isTicketFinished ? COLORS.success : COLORS.warning
                            }]}>
                                {isTicketFinished ? 'Đã hoàn tất' : 'Đang thực hiện'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Feather name="info" size={16} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Loại kiểm kê</Text>
                            <Text style={styles.infoValue}>{ticket.type || 'Manual'}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Feather name="calendar" size={16} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Ngày tạo</Text>
                            <Text style={styles.infoValue}>
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                            </Text>
                        </View>
                    </View>
                </Card>

                <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderRow}>
                        <View>
                            <Text style={styles.sectionTitle}>Danh sách hàng hóa</Text>
                            <Text style={styles.sectionSubtitle}>{ticket.items.length} mặt hàng cần đếm</Text>
                        </View>
                        <View style={styles.progressBadge}>
                            <Text style={styles.progressBadgeText}>
                                {ticket.items.filter(i => i.countedQuantity != null || revealedItems[i.id]).length}/{ticket.items.length}
                            </Text>
                        </View>
                    </View>
                </View>

                {ticket.items
                    .map(item => {
                        const isBeingEdited = editingItems[item.id];
                        const isConfirmed = item.countedQuantity != null || revealedItems[item.id];
                        const isRevealed = (isConfirmed && !isBeingEdited) || isTicketFinished;

                        const count = isRevealed 
                            ? (item.countedQuantity ?? parseInt(counts[item.id] || '0')) 
                            : parseInt(counts[item.id] || (item.countedQuantity?.toString() ?? '0'));
                        
                        const diff = count - item.systemQuantity;

                        return (
                            <Card key={item.id} style={[styles.itemCard, isRevealed && styles.itemCardRevealed]}>
                                <View style={styles.itemHeader}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.productName}>{item.name || `Sản phẩm #${item.productId}`}</Text>
                                        <View style={styles.skuBadge}>
                                            <Text style={styles.skuText}>{item.sku || 'N/A'}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={[styles.statusBadgeItem, {
                                        backgroundColor: isConfirmed ? COLORS.success + '20' : COLORS.warning + '20'
                                    }]}>
                                        <Text style={[styles.statusBadgeItemText, {
                                            color: isConfirmed ? COLORS.success : COLORS.warning
                                        }]}>
                                            {isConfirmed ? 'Đã đếm' : 'Chờ'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.countGrid}>
                                    <View style={styles.countColumn}>
                                        <Text style={styles.countLabel}>Hệ thống</Text>
                                        <TouchableOpacity 
                                            activeOpacity={isRevealed ? 1 : 0.7}
                                            style={[styles.qtyBox, isRevealed && styles.qtyBoxRevealed]}
                                            onPress={() => {
                                                if (!isRevealed) {
                                                    AlertService.warning(
                                                        'Chế độ Blind Count',
                                                        'Hệ thống đang ẩn số lượng dữ liệu để đảm bảo tính khách quan. Số lượng sẽ hiện ra sau khi bạn xác nhận kết quả đếm.'
                                                    );
                                                }
                                            }}
                                        >
                                            <Text style={isRevealed ? styles.systemQtyValue : styles.hiddenQtyValue}>
                                                {isRevealed ? item.systemQuantity : '??'}
                                            </Text>
                                            {!isRevealed && <Feather name="lock" size={14} color={COLORS.textMuted} />}
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.countColumn}>
                                        <Text style={styles.countLabel}>Thực tế</Text>
                                        <View style={[styles.inputContainer, isRevealed && styles.inputContainerDisabled]}>
                                            <TextInput
                                                style={[styles.countInput, isRevealed && styles.revealedInput]}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                value={isRevealed ? (item.countedQuantity?.toString() || counts[item.id] || '') : (counts[item.id] || '')}
                                                onChangeText={(v) => handleCountChange(item.id, v)}
                                                editable={!isRevealed}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {isRevealed ? (
                                    <View style={styles.revealedFooterRow}>
                                        <View style={[styles.diffBadge, {
                                            backgroundColor: diff === 0 ? '#DCFCE7' : (diff > 0 ? '#FEF3C7' : '#FEE2E2'),
                                            flex: 1,
                                            height: 38,
                                            justifyContent: 'center'
                                        }]}>
                                            <Feather
                                                name={diff === 0 ? "check-circle" : (diff > 0 ? "arrow-up" : "arrow-down")}
                                                size={13}
                                                color={diff === 0 ? '#166534' : (diff > 0 ? '#B45309' : '#991B1B')}
                                            />
                                            <Text style={[styles.diffBadgeText, {
                                                color: diff === 0 ? '#166534' : (diff > 0 ? '#B45309' : '#991B1B')
                                            }]}>
                                                {diff === 0 ? 'Khớp' : (diff > 0 ? `Dư: +${diff}` : `Thiếu: ${diff}`)}
                                            </Text>
                                        </View>

                                        {!isTicketFinished && (
                                            <TouchableOpacity 
                                                style={[styles.editBtn, { flex: 1, height: 38, justifyContent: 'center' }]}
                                                onPress={() => handleEditItem(item.id)}
                                            >
                                                <Feather name="edit-2" size={13} color={COLORS.primary} />
                                                <Text style={styles.editBtnText}>Sửa lại</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ) : (
                                    !isTicketFinished && (
                                        <TouchableOpacity
                                            style={[styles.confirmItemBtn, isProcessing && { opacity: 0.7 }]}
                                            onPress={() => handleConfirmItem(item)}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Feather name="check" size={18} color="#fff" />
                                            )}
                                            <Text style={styles.confirmItemBtnText}>
                                                {isProcessing ? 'Đang lưu...' : 'Xác nhận kết quả'}
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                )}
                                
                                {item.locationId && (
                                    <TouchableOpacity 
                                        style={styles.locationContainer}
                                        onPress={() => openWarehouseForItem(item)}
                                    >
                                        <View style={styles.locationLeft}>
                                            <Feather name="map-pin" size={14} color={COLORS.primary} />
                                            <Text style={styles.locationText}>Vị trí: <Text style={styles.boldText}>Bin #{item.locationId}</Text></Text>
                                        </View>
                                        <Text style={styles.viewOnMapText}>Tìm trên sơ đồ</Text>
                                        <Feather name="chevron-right" size={14} color={COLORS.primary} />
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity 
                                    style={[styles.locationContainer, { marginTop: 8 }]}
                                    onPress={() => {
                                        if (!ticket?.warehouseId) {
                                            AlertService.warning('Lỗi', 'Không xác định được kho hàng.');
                                            return;
                                        }
                                        router.push({
                                            pathname: '/warehouse-view',
                                            params: {
                                                warehouseId: String(ticket.warehouseId || ''),
                                                inventoryCountTicketId: String(ticket.id),
                                                focusedItemId: String(item.productId),
                                                focusedItemName: item.name || `SP #${item.productId}`,
                                            },
                                        } as any);
                                    }}
                                >
                                    <View style={styles.locationLeft}>
                                        <Feather name="search" size={14} color={COLORS.info} />
                                        <Text style={[styles.locationText, { color: COLORS.info }]}>Xem vị trí sản phẩm</Text>
                                    </View>
                                    <Feather name="chevron-right" size={14} color={COLORS.info} />
                                </TouchableOpacity>
                            </Card>
                        );
                    })}
                <View style={{ height: 40 }} />
            </RefreshContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textMuted,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#F9FAFB',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: 24,
    },
    retryBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
        padding: 16,
        borderRadius: 16,
    },
    statusSection: {
        marginBottom: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    blindCountingBox: {
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    blindHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    blindTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#B45309',
    },
    blindCountingText: {
        fontSize: 12,
        color: '#92400E',
        lineHeight: 18,
    },
    warehouseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginBottom: 20,
        padding: 16,
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
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    warehouseTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 2,
    },
    warehouseSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    progressBadge: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    progressBadgeText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    itemCard: {
        marginBottom: 16,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    itemCardRevealed: {
        backgroundColor: '#FBFBFC',
        borderColor: '#E5E7EB',
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
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 6,
    },
    skuBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
    },
    skuText: {
        fontSize: 11,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    statusBadgeItem: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusBadgeItemText: {
        fontSize: 11,
        fontWeight: '700',
    },
    countGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    countColumn: {
        flex: 1,
    },
    countLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginBottom: 6,
        fontWeight: '600',
        textAlign: 'center',
    },
    qtyBox: {
        height: 48,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    qtyBoxRevealed: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    systemQtyValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    hiddenQtyValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textMuted,
    },
    inputContainer: {
        height: 48,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    inputContainerDisabled: {
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    countInput: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    revealedInput: {
        color: COLORS.text,
    },
    diffRow: {
        marginBottom: 16,
        alignItems: 'center',
    },
    diffBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    diffBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    confirmItemBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    confirmItemBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    revealedFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    revealedFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    revealedText: {
        fontSize: 13,
        color: '#059669',
        fontWeight: '600',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: COLORS.primary + '10',
    },
    editBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    locationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    viewOnMapText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginLeft: 'auto',
        marginRight: 4,
    },
    boldText: {
        fontWeight: 'bold',
        color: COLORS.text,
    },
});
