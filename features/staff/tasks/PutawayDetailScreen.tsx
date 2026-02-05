import { Card, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PutawayDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    // In a real app, we would fetch this from a context
    const mockTask = {
        id: 'put-001',
        orderNumber: 'PUT-2026-001',
        type: 'putaway',
        status: 'pending',
        priority: 'low',
        itemCount: 12,
        warehouse: 'WH-HCM-01',
        location: 'Zone A',
        targetLocation: 'RACK-B12',
        items: [
            { id: '1', productName: 'iPhone 15 Pro', sku: 'IP15P-256-GRY', quantity: 5 },
            { id: '2', productName: 'MacBook Air M2', sku: 'MBA-M2-8-256-SLV', quantity: 7 },
        ]
    };

    const [isProcessing, setIsProcessing] = useState(false);
    const [isLocationScanned, setIsLocationScanned] = useState(false);

    const handleScanLocation = () => {
        setIsProcessing(true);
        // Simulate scanning delay
        setTimeout(() => {
            setIsProcessing(false);
            setIsLocationScanned(true);
            Alert.alert('Thành công', 'Đã xác nhận đúng vị trí ' + mockTask.targetLocation);
        }, 800);
    };

    const handleComplete = () => {
        if (!isLocationScanned) {
            Alert.alert('Lưu ý', 'Vui lòng quét mã vị trí trước khi xác nhận');
            return;
        }
        setIsProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            Alert.alert('Thành công', 'Đã hoàn thành xếp hàng vào vị trí ' + mockTask.targetLocation);
            router.back();
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Xếp hàng (Putaway)"
                subtitle={mockTask.orderNumber}
            />

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Card style={styles.infoCard}>
                    <View style={styles.locationRow}>
                        <View style={styles.locationBox}>
                            <Text style={styles.locationLabel}>Từ khu vực</Text>
                            <Text style={styles.locationValue}>{mockTask.location}</Text>
                        </View>
                        <Feather name="arrow-right" size={20} color={COLORS.textMuted} />
                        <View style={styles.locationBox}>
                            <Text style={styles.locationLabel}>Đến vị trí</Text>
                            <Text style={[styles.locationValue, isLocationScanned && { color: '#059669' }]}>{mockTask.targetLocation}</Text>
                        </View>
                    </View>
                </Card>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Sản phẩm cần xếp ({mockTask.itemCount})</Text>
                </View>

                {mockTask.items.map(item => (
                    <Card key={item.id} style={styles.itemCard}>
                        <View style={styles.itemInfo}>
                            <Text style={styles.productName}>{item.productName}</Text>
                            <Text style={styles.skuText}>SKU: {item.sku}</Text>
                        </View>
                        <View style={styles.qtyContainer}>
                            <Text style={styles.qtyValue}>{item.quantity}</Text>
                            <Text style={styles.qtyLabel}>món</Text>
                        </View>
                    </Card>
                ))}

                <TouchableOpacity
                    style={[styles.scanLocationBtn, isLocationScanned && styles.scanLocationBtnSuccess]}
                    onPress={handleScanLocation}
                    disabled={isLocationScanned || isProcessing}
                >
                    <Feather name={isLocationScanned ? "check-circle" : "maximize"} size={20} color={isLocationScanned ? "#059669" : COLORS.primary} />
                    <Text style={[styles.scanLocationText, isLocationScanned && { color: '#059669' }]}>
                        {isLocationScanned ? "Đã quét vị trí khớp" : "Quét mã vị trí đích (Rack/Bin)"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.completeBtn,
                        (isProcessing || !isLocationScanned) && styles.disabledBtn
                    ]}
                    onPress={handleComplete}
                    disabled={isProcessing || !isLocationScanned}
                >
                    <Text style={styles.completeBtnText}>
                        {isProcessing ? 'Đang xử lý...' : 'Xác nhận đã xếp hàng'}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
});
