import { Card } from '@/components/ui/Card';
import { SafeAreaHeader } from '@/components/ui/SafeAreaHeader';
import { COLORS } from '@/constants/color';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const mockTask = {
    id: '1',
    taskNumber: 'CNT-2024-001',
    type: 'Cycle Count',
    status: 'In Progress',
    warehouse: 'Main Warehouse',
    location: 'Zone A - Rack 04',
    itemCount: 3,
    date: '2024-05-20',
    items: [
        { id: '101', productName: 'iPhone 15 Pro Case', sku: 'SKU-7721', systemQty: 24 },
        { id: '102', productName: 'Samsung S24 Ultra Screen Protector', sku: 'SKU-8832', systemQty: 50 },
        { id: '103', productName: 'USB-C Charging Cable 2m', sku: 'SKU-1123', systemQty: 100 },
    ],
};

export default function InventoryCountDetailScreen() {
    const router = useRouter();
    const [counts, setCounts] = useState<Record<string, string>>({});
    const [revealedItems, setRevealedItems] = useState<Record<string, boolean>>({});
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCountChange = (itemId: string, value: string) => {
        // Only allow numbers
        const cleanValue = value.replace(/[^0-9]/g, '');
        setCounts(prev => ({ ...prev, [itemId]: cleanValue }));
    };

    const handleConfirmItem = (item: typeof mockTask.items[0]) => {
        const countStr = counts[item.id] || '';
        if (countStr === '') {
            Alert.alert('Lưu ý', 'Vui lòng nhập số lượng trước khi xác nhận');
            return;
        }

        const count = parseInt(countStr);
        const diff = Math.abs(count - item.systemQty);

        setRevealedItems(prev => ({ ...prev, [item.id]: true }));

        if (diff > item.systemQty * 0.2) {
            Alert.alert(
                'Cảnh báo sai lệch lớn',
                `Số lượng đếm (${count}) lệch quá 20% so với hệ thống (${item.systemQty}). Vui lòng kiểm tra lại.`
            );
        }
    };

    const handleComplete = () => {
        const allConfirmed = mockTask.items.every(item => revealedItems[item.id]);
        if (!allConfirmed) {
            Alert.alert('Lưu ý', 'Vui lòng xác nhận số lượng cho tất cả các mặt hàng');
            return;
        }

        setIsProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            Alert.alert('Thành công', 'Đã lưu kết quả kiểm kê');
            router.back();
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaHeader showBackButton backgroundColor="#fff" style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Kiểm kê (Physical Count)</Text>
                    <Text style={styles.headerSubtitle}>{mockTask.taskNumber}</Text>
                </View>
            </SafeAreaHeader>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Feather name="map-pin" size={16} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Vị trí đếm</Text>
                            <Text style={styles.infoValue}>{mockTask.location}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Feather name="calendar" size={16} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Ngày thực hiện</Text>
                            <Text style={styles.infoValue}>{mockTask.date}</Text>
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

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Sản phẩm cần đếm ({mockTask.itemCount})</Text>
                </View>

                {mockTask.items.map(item => {
                    const isRevealed = revealedItems[item.id];
                    const count = parseInt(counts[item.id] || '0');
                    const diff = count - item.systemQty;

                    return (
                        <Card key={item.id} style={[styles.itemCard, isRevealed && styles.itemCardRevealed]}>
                            <View style={styles.itemHeader}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.productName}>{item.productName}</Text>
                                    <View style={styles.skuBadge}>
                                        <Text style={styles.skuText}>{item.sku}</Text>
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
                                            {isRevealed ? item.systemQty : '??'}
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
                                            value={counts[item.id] || ''}
                                            onChangeText={(v) => handleCountChange(item.id, v)}
                                            editable={!isRevealed}
                                        />
                                    </View>
                                </View>
                            </View>

                            {!isRevealed ? (
                                <TouchableOpacity
                                    style={styles.confirmItemBtn}
                                    onPress={() => handleConfirmItem(item)}
                                >
                                    <Feather name="check" size={18} color="#fff" />
                                    <Text style={styles.confirmItemBtnText}>Xác nhận kết quả đếm</Text>
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
                    style={[styles.completeBtn, (isProcessing || !mockTask.items.every(i => revealedItems[i.id])) && styles.disabledBtn]}
                    onPress={handleComplete}
                    disabled={isProcessing || !mockTask.items.every(i => revealedItems[i.id])}
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
});
