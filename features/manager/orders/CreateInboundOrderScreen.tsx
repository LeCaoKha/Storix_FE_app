import { Card, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useCreateInboundTicket, useInboundRequest } from '@/hooks';
import { useProducts } from '@/hooks/product.hooks';
import { useWarehouseStaff } from '@/hooks/user.hooks';
import { useAuthStore } from '@/stores/auth.store';
import { getLatestPrice } from '@/types/product';
import { formatVND } from '@/utils/format';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CreateInboundOrderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Support both requestId and requisitionId (they're the same in backend)
    const requestId = (params.requestId || params.requisitionId) as string;
    const user = useAuthStore((state) => state.user);

    const { data: inboundRequest, isLoading: isLoadingRequest, error: requestError } = useInboundRequest(requestId);
    const { data: products = [] } = useProducts(); // Fetch products with prices
    const { data: staffList = [], isLoading: isLoadingStaff } = useWarehouseStaff(
        inboundRequest?.warehouseId,
        user?.companyId
    );
    const { mutateAsync: createInboundTicket } = useCreateInboundTicket();

    // Enrich inbound request items with full product data (including productPrices)
    const enrichedRequest = inboundRequest && products.length > 0 ? {
        ...inboundRequest,
        inboundOrderItems: inboundRequest.inboundOrderItems.map(item => {
            const fullProduct = products.find(p => p.id === item.productId);
            return {
                ...item,
                product: fullProduct || item.product // Use full product with prices if available
            };
        })
    } : inboundRequest;

    // Log React Query error if any
    useEffect(() => {
        if (requestError) {
            console.error('[useInboundRequest ERROR]:', requestError);
        }
    }, [requestError]);

    const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
    const [showStaffPicker, setShowStaffPicker] = useState(false);
    const [notes, setNotes] = useState('');
    const [isCreating, setIsCreating] = useState(false);



    const handleCreate = async () => {
        if (!selectedStaffId) {
            Alert.alert('Lỗi', 'Vui lòng chọn nhân viên nhập kho');
            return;
        }

        setIsCreating(true);
        try {
            // Backend tự động chuyển trạng thái request sang 'Transported' khi tạo ticket
            const created = await createInboundTicket({
                requestId: parseInt(requestId),
                createdBy: user?.id || 0,
                staffId: selectedStaffId,
            });

            Alert.alert('Thành công', 'Đã tạo đơn nhập kho', [
                {
                    text: 'OK',
                    onPress: () => {
                        router.back();
                        router.push({
                            pathname: `/(manager-tabs)/(orders-inbound)/${created.id}`,
                            params: { type: 'ticket' }
                        } as any);
                    },
                },
            ]);
        } catch (error: any) {
            console.error('Create ticket error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Không thể tạo đơn nhập kho';
            Alert.alert('Lỗi', errorMessage);
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoadingRequest) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Tạo Đơn Nhập Kho"
                rightButton={
                    <TouchableOpacity
                        style={[styles.submitButton, isCreating && styles.submitButtonDisabled]}
                        onPress={handleCreate}
                        disabled={isCreating}
                    >
                        <Text style={styles.submitButtonText}>
                            {isCreating ? 'Đang tạo...' : 'Tạo'}
                        </Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView style={styles.content}>
                {enrichedRequest && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Từ Yêu Cầu Nhập Kho</Text>
                        <Text style={styles.requisitionNumber}>Request #{enrichedRequest.id}</Text>
                        <Text style={styles.requisitionPurpose}>Trạng thái: {enrichedRequest.status}</Text>
                    </Card>
                )}

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Thông Tin Nhập Kho</Text>

                    <Text style={styles.label}>Nhà cung cấp *</Text>
                    <View style={[styles.input, styles.readOnlyField]}>
                        <Text style={styles.readOnlyText}>
                            {enrichedRequest?.supplier?.name || 'N/A'}
                        </Text>
                        <Feather name="lock" size={16} color={COLORS.textMuted} />
                    </View>

                    <Text style={styles.label}>Ngày dự kiến nhận hàng *</Text>
                    <View style={[styles.input, styles.readOnlyField]}>
                        <Text style={styles.readOnlyText}>
                            {enrichedRequest?.expectedArrivalDate
                                ? new Date(enrichedRequest.expectedArrivalDate).toLocaleDateString('vi-VN')
                                : 'N/A'
                            }
                        </Text>
                        <Feather name="lock" size={16} color={COLORS.textMuted} />
                    </View>

                    <Text style={styles.label}>Nhân viên nhập kho *</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.selectField]}
                        onPress={() => setShowStaffPicker(true)}
                        disabled={isLoadingStaff}
                    >
                        <Text style={[styles.selectFieldText, !selectedStaffId && styles.placeholder]}>
                            {isLoadingStaff
                                ? 'Đang tải...'
                                : selectedStaffId
                                    ? staffList.find(s => s.id === selectedStaffId)?.fullName || 'Chọn nhân viên'
                                    : 'Chọn nhân viên'
                            }
                        </Text>
                        <Feather name="chevron-down" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                </Card>

                {enrichedRequest && enrichedRequest.inboundOrderItems && enrichedRequest.inboundOrderItems.length > 0 && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            Sản Phẩm ({enrichedRequest.inboundOrderItems.length})
                        </Text>
                        {enrichedRequest.inboundOrderItems.map((item, index) => {
                            const latestPrice = item.product ? getLatestPrice(item.product as any) : 0;
                            const totalPrice = latestPrice * (item.expectedQuantity || 0);
                            return (
                                <View key={item.id || index}>
                                    {index > 0 && <View style={styles.itemDivider} />}
                                    <View style={styles.itemCardContent}>
                                        <View style={styles.itemMainInfo}>
                                            <View style={styles.itemHeader}>
                                                <Text style={styles.itemName} numberOfLines={1}>
                                                    {item.name || item.product?.name || `Product #${item.productId}`}
                                                </Text>
                                                {(item.sku || item.product?.sku) && (
                                                    <Text style={styles.itemSku}>SKU: {item.sku || item.product?.sku}</Text>
                                                )}
                                            </View>
                                        </View>

                                        <View style={styles.itemFooter}>
                                            <View style={styles.priceSection}>
                                                <Text style={styles.unitPriceText}>
                                                    {formatVND(latestPrice)}/đv
                                                </Text>
                                                <View style={styles.totalSection}>
                                                    <Text style={styles.totalLabel}>THÀNH TIỀN</Text>
                                                    <Text style={styles.totalValue}>{formatVND(totalPrice)}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.itemQty}>
                                                {item.expectedQuantity} pcs
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </Card>
                )}
            </ScrollView>

            {/* Staff Picker Modal */}
            <Modal
                visible={showStaffPicker}
                animationType="slide"
                transparent
                onRequestClose={() => setShowStaffPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn Nhân Viên</Text>
                            <TouchableOpacity onPress={() => setShowStaffPicker(false)}>
                                <Feather name="x" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalContent}>
                            {staffList.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>Không có nhân viên nào</Text>
                                </View>
                            ) : (
                                staffList.map(staff => (
                                    <TouchableOpacity
                                        key={staff.id}
                                        style={[
                                            styles.staffItem,
                                            selectedStaffId === staff.id && styles.staffItemSelected
                                        ]}
                                        onPress={() => {
                                            setSelectedStaffId(staff.id);
                                            setShowStaffPicker(false);
                                        }}
                                    >
                                        <View style={styles.staffInfo}>
                                            <Text style={styles.staffName} numberOfLines={2}>
                                                {staff.fullName}
                                                {staff.roleId === 3 && <Text style={{ color: COLORS.warning }}> (Manager)</Text>}
                                            </Text>
                                            <Text style={styles.staffEmail} numberOfLines={1} ellipsizeMode="tail">
                                                {staff.email}
                                            </Text>
                                        </View>
                                        {selectedStaffId === staff.id && (
                                            <Feather name="check" size={20} color={COLORS.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.createButton, isCreating && styles.createButtonDisabled]}
                    onPress={handleCreate}
                    disabled={isCreating}
                >
                    <Text style={styles.createButtonText}>
                        {isCreating ? 'Đang tạo...' : 'Tạo Đơn Nhập Kho'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    card: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },
    requisitionNumber: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 4,
    },
    requisitionPurpose: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: COLORS.text,
        backgroundColor: '#fff',
    },
    readOnlyField: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f5f5f5',
    },
    readOnlyText: {
        fontSize: 14,
        color: COLORS.text,
        flex: 1,
    },
    selectField: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectFieldText: {
        fontSize: 14,
        color: COLORS.text,
        flex: 1,
    },
    placeholder: {
        color: COLORS.textMuted,
    },
    textArea: {
        minHeight: 100,
    },
    itemRow: {
        paddingVertical: 12,
    },
    itemCardContent: {
        paddingVertical: 12,
    },
    itemMainInfo: {
        marginBottom: 10,
    },
    itemHeader: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    itemSku: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    priceSection: {
        flex: 1,
    },
    unitPriceText: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    totalSection: {
        gap: 2,
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textMuted,
        letterSpacing: 0.5,
    },
    totalValue: {
        fontSize: 17,
        fontWeight: '800',
        color: '#10B981',
    },
    itemQty: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        overflow: 'hidden',
    },
    itemDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
    },
    itemInfo: {
        flex: 1,
    },
    footer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    createButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    createButtonDisabled: {
        opacity: 0.6,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 34,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    modalContent: {
        padding: 20,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    staffItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        marginBottom: 12,
    },
    staffItemSelected: {
        backgroundColor: COLORS.primary + '15',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    staffInfo: {
        flex: 1,
    },
    staffName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    staffEmail: {
        fontSize: 13,
        color: COLORS.textMuted,
        flexWrap: 'wrap',
    },
});
