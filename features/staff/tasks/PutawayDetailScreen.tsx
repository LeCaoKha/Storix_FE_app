import { Card, ScreenHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import { useInboundOrdersByStaff, useUpdateInboundTicketItems } from '@/hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import type { InboundOrderItem } from '@/types/inbound-order';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PutawayDetailScreen() {
    const router = useRouter();
    const goBack = useAppBack('/(staff-tabs)/tasks');
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

    const [isProcessing, setIsProcessing] = useState(false);
    const [scannedLocation, setScannedLocation] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [localQuantities, setLocalQuantities] = useState<Record<number, number>>({});

    useEffect(() => {
        if (order?.inboundOrderItems) {
            const initial: Record<number, number> = {};
            order.inboundOrderItems.forEach((item) => {
                initial[item.id] = item.receivedQuantity || item.expectedQuantity || 0;
            });
            setLocalQuantities(initial);
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
        setIsCompleting(true);
        try {
            const updatedItems = items.map((item: InboundOrderItem) => ({
                id: item.id,
                productId: item.productId || 0,
                expectedQuantity: item.expectedQuantity,
                receivedQuantity: localQuantities[item.id] || item.receivedQuantity || 0,
            }));

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
                        (isCompleting || !isVerified) && styles.disabledBtn
                    ]}
                    onPress={handleComplete}
                    disabled={isCompleting || !isVerified}
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
});
