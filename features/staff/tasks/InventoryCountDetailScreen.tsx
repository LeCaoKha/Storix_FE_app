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
        setCounts(prev => ({ ...prev, [itemId]: value }));
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
                    <Text style={styles.headerTitle}>Kiểm kê (Inventory Count)</Text>
                    <Text style={styles.headerSubtitle}>{mockTask.taskNumber}</Text>
                </View>
            </SafeAreaHeader>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Feather name="layers" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>Vị trí: <Text style={styles.boldText}>{mockTask.location}</Text></Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Feather name="calendar" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>Ngày: <Text style={styles.boldText}>{mockTask.date}</Text></Text>
                    </View>
                    <View style={styles.blindCountingBox}>
                        <Feather name="eye-off" size={16} color="#B45309" />
                        <Text style={styles.blindCountingText}>Đang bật chế độ Blind Count: Vui lòng đếm thực tế trước khi xem số liệu hệ thống.</Text>
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
                        <Card key={item.id} style={styles.itemCard}>
                            <View style={styles.itemHeader}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.productName}>{item.productName}</Text>
                                    <Text style={styles.skuText}>SKU: {item.sku}</Text>
                                </View>
                                {isRevealed && (
                                    <View style={[styles.diffBadge, {
                                        backgroundColor: diff === 0 ? '#D1FAE5' : '#FEE2E2'
                                    }]}>
                                        <Text style={[styles.diffBadgeText, {
                                            color: diff === 0 ? '#059669' : '#DC2626'
                                        }]}>
                                            {diff === 0 ? 'Khớp' : `${diff > 0 ? '+' : ''}${diff}`}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.countRow}>
                                <View style={styles.countField}>
                                    <Text style={styles.countLabel}>Số hệ thống</Text>
                                    <View style={styles.qtyBox}>
                                        <Text style={isRevealed ? styles.systemQtyValue : styles.hiddenQtyValue}>
                                            {isRevealed ? item.systemQty : '??'}
                                        </Text>
                                        {!isRevealed && <Feather name="lock" size={12} color={COLORS.textMuted} />}
                                    </View>
                                </View>

                                <View style={styles.countField}>
                                    <Text style={styles.countLabel}>Số thực đếm</Text>
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

                            {!isRevealed ? (
                                <TouchableOpacity
                                    style={styles.confirmItemBtn}
                                    onPress={() => handleConfirmItem(item)}
                                >
                                    <Text style={styles.confirmItemBtnText}>Xác nhận số lượng</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.revealedFooter}>
                                    <Feather name="check" size={16} color="#059669" />
                                    <Text style={styles.revealedText}>Đã ghi nhận kết quả</Text>
                                </View>
                            )}
                        </Card>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.completeBtn, isProcessing && styles.disabledBtn]}
                    onPress={handleComplete}
                    disabled={isProcessing}
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
    blindCountingBox: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 8,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    blindCountingText: {
        flex: 1,
        fontSize: 12,
        color: '#B45309',
        lineHeight: 18,
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
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    skuText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    diffBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    diffBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    countRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    countField: {
        flex: 1,
    },
    countLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 6,
        fontWeight: '600',
    },
    qtyBox: {
        height: 44,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    systemQtyValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    hiddenQtyValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textMuted,
    },
    countInput: {
        height: 44,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        color: COLORS.primary,
    },
    revealedInput: {
        backgroundColor: '#F9FAFB',
        borderColor: COLORS.border,
        color: COLORS.text,
    },
    confirmItemBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmItemBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    revealedFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    revealedText: {
        fontSize: 13,
        color: '#059669',
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    completeBtn: {
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completeBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    disabledBtn: {
        opacity: 0.6,
    },
});
