import { Card } from '@/components/ui/Card';
import { SafeAreaHeader } from '@/components/ui/SafeAreaHeader';
import { COLORS } from '@/constants/color';
import { useInboundOrders } from '@/contexts/InboundOrderContext';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function InboundDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { getInboundOrderById, updateReceivedQuantities, updateInboundStatus } = useInboundOrders();

    const order = getInboundOrderById(id);
    const [localQuantities, setLocalQuantities] = useState<Record<string, number>>(
        order?.items.reduce((acc, item) => ({ ...acc, [item.id]: item.receivedQty }), {}) || {}
    );
    const [localItemData, setLocalItemData] = useState<Record<string, { batch: string, expiry: string, qc: 'good' | 'damaged' | 'returned' }>>(
        order?.items.reduce((acc, item) => ({
            ...acc,
            [item.id]: { batch: '', expiry: '', qc: 'good' }
        }), {}) || {}
    );
    const [isSaving, setIsSaving] = useState(false);

    if (!order) {
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

    const handleUpdateQty = (itemId: string, increment: boolean) => {
        setLocalQuantities(prev => {
            const current = prev[itemId] || 0;
            const item = order.items.find(i => i.id === itemId);
            const newValue = increment
                ? Math.min(current + 1, item?.expectedQty || 9999)
                : Math.max(current - 1, 0);
            return { ...prev, [itemId]: newValue };
        });
    };

    const handleUpdateItemData = (itemId: string, field: string, value: string) => {
        setLocalItemData(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updates = Object.entries(localQuantities).map(([itemId, receivedQty]) => ({
                itemId,
                receivedQty,
                ...localItemData[itemId],
            }));

            // In a real app, updateReceivedQuantities would be updated to take these fields
            await updateReceivedQuantities(order.id, updates as any);

            // Check if all items received
            const allReceived = order.items.every(item =>
                (localQuantities[item.id] || 0) >= item.expectedQty
            );

            if (allReceived && order.status !== 'completed') {
                await updateInboundStatus(order.id, 'completed');
            } else if (order.status === 'scheduled') {
                await updateInboundStatus(order.id, 'receiving');
            }

            Alert.alert('Thành công', 'Đã lưu thông tin nhận hàng và số lô/hạn sử dụng');
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
                    <Text style={styles.headerTitle}>Nhập Kho</Text>
                    <Text style={styles.headerSubtitle}>{order.inboundNumber}</Text>
                </View>
            </SafeAreaHeader>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Feather name="truck" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>Nhà cung cấp: <Text style={styles.boldText}>{order.supplier}</Text></Text>
                    </View>
                    {order.poReference && (
                        <View style={styles.infoRow}>
                            <Feather name="file-text" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoText}>Mã PO: <Text style={styles.boldText}>{order.poReference}</Text></Text>
                        </View>
                    )}
                </Card>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Danh sách sản phẩm</Text>
                    <Text style={styles.sectionSubtitle}>{order.items.length} mặt hàng</Text>
                </View>

                {order.items.map(item => (
                    <Card key={item.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.productName}>{item.productName}</Text>
                                <Text style={styles.skuText}>SKU: {item.sku}</Text>
                            </View>
                            <View style={[styles.statusBadge, {
                                backgroundColor: (localQuantities[item.id] || 0) >= item.expectedQty ? '#D1FAE5' : '#FEF3C7'
                            }]}>
                                <Text style={[styles.statusBadgeText, {
                                    color: (localQuantities[item.id] || 0) >= item.expectedQty ? '#059669' : '#D97706'
                                }]}>
                                    {(localQuantities[item.id] || 0) >= item.expectedQty ? 'Đủ' : 'Chờ'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.counterRow}>
                            <Text style={styles.qtyLabel}>Số lượng đã nhận:</Text>
                            <View style={styles.counter}>
                                <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => handleUpdateQty(item.id, false)}
                                >
                                    <Feather name="minus" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                                <View style={styles.qtyDisplay}>
                                    <Text style={styles.qtyValue}>{localQuantities[item.id] || 0}</Text>
                                    <Text style={styles.qtyTotal}>/ {item.expectedQty}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.counterBtn}
                                    onPress={() => handleUpdateQty(item.id, true)}
                                >
                                    <Feather name="plus" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Business Logic: Batch & Expiry & QC */}
                        <View style={styles.businessLogicSection}>
                            <View style={styles.dataGrid}>
                                <View style={styles.dataField}>
                                    <Text style={styles.dataLabel}>Số lô (Batch)</Text>
                                    <TextInput
                                        style={styles.dataInput}
                                        placeholder="Nhập số lô"
                                        value={localItemData[item.id]?.batch}
                                        onChangeText={(v) => handleUpdateItemData(item.id, 'batch', v)}
                                    />
                                </View>
                                <View style={styles.dataField}>
                                    <Text style={styles.dataLabel}>Hạn dùng (Exp)</Text>
                                    <TextInput
                                        style={styles.dataInput}
                                        placeholder="DD/MM/YYYY"
                                        value={localItemData[item.id]?.expiry}
                                        onChangeText={(v) => handleUpdateItemData(item.id, 'expiry', v)}
                                    />
                                </View>
                            </View>

                            <Text style={styles.dataLabel}>Tình trạng QC</Text>
                            <View style={styles.qcOptions}>
                                <TouchableOpacity
                                    style={[styles.qcOption, localItemData[item.id]?.qc === 'good' && styles.qcOptionActive]}
                                    onPress={() => handleUpdateItemData(item.id, 'qc', 'good')}
                                >
                                    <Text style={[styles.qcOptionText, localItemData[item.id]?.qc === 'good' && styles.qcOptionTextActive]}>Hàng tốt</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.qcOption, localItemData[item.id]?.qc === 'damaged' && styles.qcOptionActiveDanger]}
                                    onPress={() => handleUpdateItemData(item.id, 'qc', 'damaged')}
                                >
                                    <Text style={[styles.qcOptionText, localItemData[item.id]?.qc === 'damaged' && styles.qcOptionTextActive]}>Lỗi/Hỏng</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.scanItemBtn}>
                            <Feather name="maximize" size={16} color={COLORS.primary} />
                            <Text style={styles.scanItemBtnText}>Scan mã vạch sản phẩm này</Text>
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
                        {isSaving ? 'Đang lưu...' : 'Hoàn tất nhận hàng'}
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
