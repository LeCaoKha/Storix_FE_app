import { Card, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useStockCountTicket, useUpdateStockCountItem } from '@/hooks/stock-count.hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { StockCountItem } from '@/services/stock-count.api';
import { AlertService } from '@/stores/alert.store';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InventoryCountDetailScreen() {
    const router = useRouter();
    const goBack = useAppBack('/(staff-tabs)/tasks');
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const ticketId = parseInt(id || '0');

    const { data: ticket, isLoading, error } = useStockCountTicket(ticketId);
    const updateItem = useUpdateStockCountItem();

    const [counts, setCounts] = useState<Record<number, string>>({});
    const [revealedItems, setRevealedItems] = useState<Record<number, boolean>>({});
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCountChange = (itemId: number, value: string) => {
        // Only allow numbers
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
            await updateItem.mutateAsync({
                itemId: item.id,
                payload: {
                    countedQuantity: count,
                    status: 'Counted'
                }
            });

            setRevealedItems(prev => ({ ...prev, [item.id]: true }));

            const diff = Math.abs(count - item.systemQuantity);
            if (diff > item.systemQuantity * 0.2) {
                AlertService.warning(
                    'Cảnh báo sai lệch lớn',
                    `Số lượng đếm (${count}) lệch quá 20% so với hệ thống (${item.systemQuantity}). Vui lòng kiểm tra lại.`
                );
            }
        } catch (error) {
            console.error('Failed to update count:', error);
            AlertService.error('Lỗi', 'Không thể cập nhật số lượng. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleComplete = () => {
        if (!ticket) return;
        const allConfirmed = ticket.items.every(item => revealedItems[item.id] || item.countedQuantity !== null);
        if (!allConfirmed) {
            AlertService.warning('Lưu ý', 'Vui lòng xác nhận số lượng cho tất cả các mặt hàng');
            return;
        }

        AlertService.success('Thành công', 'Đã lưu kết quả kiểm kê', () => {
            goBack();
        });
    };

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
                title="Kiểm kê (Physical Count)"
                subtitle={ticket.name || `CNT-${ticket.id}`}
            />

            <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Feather name="info" size={16} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Loại kiểm kê</Text>
                            <Text style={styles.infoValue}>{ticket.type || 'N/A'}</Text>
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

                    <View style={styles.blindCountingBox}>
                        <View style={styles.blindHeader}>
                            <Feather name="eye-off" size={14} color="#B45309" />
                            <Text style={styles.blindTitle}>Chế độ Blind Count đang bật</Text>
                        </View>
                        <Text style={styles.blindCountingText}>Bạn cần nhập số lượng đếm thực tế trước khi hệ thống hiển thị số liệu tồn kho đối soát.</Text>
                    </View>
                </Card>

                {/* Warehouse Location Shortcut */}
                <TouchableOpacity
                    style={styles.warehouseCard}
                    onPress={() => router.push('/(staff-tabs)/tasks/warehouse')}
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
                    <Text style={styles.sectionTitle}>Sản phẩm cần đếm ({ticket.items.length})</Text>
                </View>

                {ticket.items.map(item => {
                    const isRevealed = revealedItems[item.id] || item.countedQuantity !== null;
                    const count = isRevealed ? (item.countedQuantity ?? parseInt(counts[item.id] || '0')) : parseInt(counts[item.id] || '0');
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
                                {isRevealed && (
                                    <View style={[styles.diffBadge, {
                                        backgroundColor: diff === 0 ? '#DCFCE7' : '#FEE2E2'
                                    }]}>
                                        <Feather
                                            name={diff === 0 ? "check-circle" : (diff > 0 ? "arrow-up" : "arrow-down")}
                                            size={12}
                                            color={diff === 0 ? '#166534' : '#991B1B'}
                                        />
                                        <Text style={[styles.diffBadgeText, {
                                            color: diff === 0 ? '#166534' : '#991B1B'
                                        }]}>
                                            {diff === 0 ? 'Khớp' : `${diff > 0 ? '+' : ''}${diff}`}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.countGrid}>
                                <View style={styles.countColumn}>
                                    <Text style={styles.countLabel}>Số hệ thống</Text>
                                    <View style={[styles.qtyBox, isRevealed && styles.qtyBoxRevealed]}>
                                        <Text style={isRevealed ? styles.systemQtyValue : styles.hiddenQtyValue}>
                                            {isRevealed ? item.systemQuantity : '??'}
                                        </Text>
                                        {!isRevealed && <Feather name="lock" size={14} color={COLORS.textMuted} />}
                                    </View>
                                </View>

                                <View style={styles.countColumn}>
                                    <Text style={styles.countLabel}>Thực tế đếm</Text>
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

                            {!isRevealed ? (
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
                                        {isProcessing ? 'Đang lưu...' : 'Xác nhận kết quả đếm'}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.revealedFooter}>
                                    <View style={styles.checkBadge}>
                                        <Feather name="check" size={14} color="#059669" />
                                    </View>
                                    <Text style={styles.revealedText}>Đã hoàn thành đối soát</Text>
                                </View>
                            )}
                        </Card>
                    );
                })}
                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.completeBtn, (isProcessing || !ticket.items.every(item => revealedItems[item.id] || item.countedQuantity !== null)) && styles.disabledBtn]}
                    onPress={handleComplete}
                    disabled={isProcessing || !ticket.items.every(item => revealedItems[item.id] || item.countedQuantity !== null)}
                >
                    <Text style={styles.completeBtnText}>
                        {isProcessing ? 'Đang lưu...' : 'Hoàn thành đợt kiểm kê'}
                    </Text>
                </TouchableOpacity>
            </View>
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
        fontSize: 16,
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
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
    },
    retryBtn: {
        marginTop: 24,
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
    header: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
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
        padding: 16,
        borderRadius: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
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
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
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
        marginBottom: 6,
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
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
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
        borderColor: '#E5E7EB',
        backgroundColor: '#FBFBFC',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    itemInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 6,
    },
    skuBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    skuText: {
        fontSize: 11,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    diffBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    diffBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    countGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    countColumn: {
        flex: 1,
    },
    countLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 8,
        fontWeight: '600',
        textAlign: 'center',
    },
    qtyBox: {
        height: 52,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    qtyBoxRevealed: {
        backgroundColor: '#fff',
    },
    systemQtyValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    hiddenQtyValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textMuted,
    },
    inputContainer: {
        height: 52,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
        overflow: 'hidden',
    },
    inputContainerDisabled: {
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    countInput: {
        flex: 1,
        paddingHorizontal: 12,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: COLORS.primary,
    },
    revealedInput: {
        color: COLORS.text,
    },
    confirmItemBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmItemBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    revealedFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    checkBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    revealedText: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    completeBtn: {
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    completeBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    disabledBtn: {
        backgroundColor: '#E5E7EB',
        shadowOpacity: 0,
        elevation: 0,
    },
    warehouseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
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
