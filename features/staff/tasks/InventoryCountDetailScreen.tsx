import { Card } from '@/components/ui/Card';
import { SafeAreaHeader } from '@/components/ui/SafeAreaHeader';
import { COLORS } from '@/constants/color';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function InventoryCountDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    // Mock data
    const mockTask = {
        id: 'cnt-001',
        orderNumber: 'CNT-2026-001',
        type: 'count',
        status: 'in_progress',
        warehouse: 'WH-HCM-01',
        location: 'Zone C - Row 4',
        items: [
            { id: '1', productName: 'Bàn phím cơ Keychron K2', sku: 'KC-K2-RGB-RED', expectedQty: 15 },
            { id: '2', productName: 'Chuột Logitech G Pro', sku: 'LOGI-GPRO-WL', expectedQty: 24 },
            { id: '3', productName: 'Tai nghe Sony WH-1000XM5', sku: 'Sony-XM5-BLK', expectedQty: 6 },
        ]
    };

    const [counts, setCounts] = useState<Record<string, string>>(
        mockTask.items.reduce((acc, item) => ({ ...acc, [item.id]: '' }), {})
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCountChange = (id: string, value: string) => {
        setCounts(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = () => {
        const anyEmpty = Object.values(counts).some(v => v === '');
        if (anyEmpty) {
            Alert.alert('Lưu ý', 'Vui lòng nhập đầy đủ số lượng cho tất cả sản phẩm');
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            Alert.alert('Thành công', 'Đã lưu kết quả kiểm kê');
            router.back();
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaHeader showBackButton backgroundColor="#fff" style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Kiểm kê (Cycle Count)</Text>
                    <Text style={styles.headerSubtitle}>{mockTask.orderNumber}</Text>
                </View>
            </SafeAreaHeader>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Card style={styles.locationCard}>
                    <View style={styles.infoRow}>
                        <Feather name="map-pin" size={16} color={COLORS.primary} />
                        <Text style={styles.locationText}>Vị trí cần kiểm: <Text style={styles.boldText}>{mockTask.location}</Text></Text>
                    </View>
                </Card>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Sản phẩm trong khu vực</Text>
                </View>

                {mockTask.items.map(item => (
                    <Card key={item.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.productName}>{item.productName}</Text>
                                <Text style={styles.skuText}>SKU: {item.sku}</Text>
                            </View>
                            <TouchableOpacity style={styles.scanBtn}>
                                <Feather name="maximize" size={18} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>Số lượng thực tế:</Text>
                            <TextInput
                                style={styles.qtyInput}
                                value={counts[item.id]}
                                onChangeText={(val) => handleCountChange(item.id, val)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>
                    </Card>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitBtn, isSubmitting && styles.disabledBtn]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    <Text style={styles.submitBtnText}>
                        {isSubmitting ? 'Đang lưu...' : 'Gửi kết quả kiểm kê'}
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
    locationCard: {
        marginBottom: 20,
        backgroundColor: COLORS.primary + '05',
        borderColor: COLORS.primary + '30',
        borderWidth: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationText: {
        fontSize: 14,
        color: COLORS.text,
    },
    boldText: {
        fontWeight: 'bold',
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
    scanBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 12,
    },
    inputLabel: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    qtyInput: {
        width: 100,
        height: 44,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        backgroundColor: '#F3F4F6',
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledBtn: {
        opacity: 0.6,
    },
});
