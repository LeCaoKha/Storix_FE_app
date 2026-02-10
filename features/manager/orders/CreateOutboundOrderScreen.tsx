import { Card, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useCreateOutboundTicket, useOutboundRequest, useUpdateOutboundRequestStatus } from '@/hooks';
import { useWarehouseStaff } from '@/hooks/user.hooks';
import { useAuthStore } from '@/stores/auth.store';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateOutboundOrderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const requisitionId = params.requisitionId as string;

    const { data: requisition, isLoading: isLoadingRequisition } = useOutboundRequest(requisitionId);
    const { mutateAsync: createOutboundTicket } = useCreateOutboundTicket();
    const { mutateAsync: updateStatus } = useUpdateOutboundRequestStatus();
    const { user } = useAuthStore();

    // Thêm staff list để chọn nhân viên xử lý
    const { data: staffList = [], isLoading: isLoadingStaff } = useWarehouseStaff(
        requisition?.warehouseId,
        user?.companyId
    );

    const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
    const [showStaffPicker, setShowStaffPicker] = useState(false);
    const [notes, setNotes] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (requisition) {
            setNotes(requisition.destination || '');
        }
    }, [requisition]);

    const handleCreate = async () => {
        if (!selectedStaffId) {
            Alert.alert('Lỗi', 'Vui lòng chọn nhân viên xử lý');
            return;
        }

        setIsCreating(true);
        try {
            const created = await createOutboundTicket({
                requestId: parseInt(requisitionId),
                createdBy: user?.id || 0,
                staffId: selectedStaffId,
                note: notes.trim() || undefined
            });

            // Cập nhật trạng thái phiếu đề nghị thành 'completed'
            if (requisition) {
                await updateStatus({
                    requestId: requisition.id,
                    approverId: user?.id || 0,
                    status: 'completed'
                });
            }

            Alert.alert('Thành công', 'Đã tạo đơn xuất kho', [
                {
                    text: 'OK',
                    onPress: () => {
                        router.back();
                        router.push({
                            pathname: `/(manager-tabs)/(orders-outbound)/${created.id}`,
                            params: { type: 'ticket' }
                        } as any);
                    },
                },
            ]);
        } catch (error) {
            console.error('Create ticket error:', error);
            Alert.alert('Lỗi', 'Không thể tạo đơn xuất kho');
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoadingRequisition) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Tạo Đơn Xuất Kho"
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
                {requisition && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Từ Đề Xuất</Text>
                        <Text style={styles.requisitionNumber}>#{requisition.id}</Text>
                        <Text style={styles.requisitionPurpose}>Trạng thái: {requisition.status}</Text>
                    </Card>
                )}

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Thông Tin Xuất Kho</Text>

                    <Text style={styles.label}>Điểm đến</Text>
                    <View style={[styles.input, styles.readOnlyField]}>
                        <Text style={styles.readOnlyText}>
                            {requisition?.destination || 'N/A'}
                        </Text>
                        <Feather name="lock" size={16} color={COLORS.textMuted} />
                    </View>

                    <Text style={styles.label}>Nhân viên xử lý *</Text>
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

                    <Text style={styles.label}>Ghi chú</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Nhập ghi chú..."
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        placeholderTextColor={COLORS.textMuted}
                    />
                </Card>

                {requisition && requisition.outboundOrderItems && requisition.outboundOrderItems.length > 0 && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            Sản Phẩm ({requisition.outboundOrderItems.length})
                        </Text>
                        {requisition.outboundOrderItems.map((item, index) => (
                            <View key={item.id || index}>
                                {index > 0 && <View style={styles.itemDivider} />}
                                <View style={styles.itemRow}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName}>
                                            {item.product?.name || `Product #${item.productId}`}
                                        </Text>
                                        {item.product?.sku && (
                                            <Text style={styles.itemSku}>SKU: {item.product.sku}</Text>
                                        )}
                                    </View>
                                    <Text style={styles.itemQty}>
                                        {item.quantity} pcs
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </Card>
                )}
            </ScrollView>

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
                                            <Text style={styles.staffName}>
                                                {staff.fullName}
                                            </Text>
                                            <Text style={styles.staffEmail}>
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
                        {isCreating ? 'Đang tạo...' : 'Tạo Đơn Xuất Kho'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background || '#f5f5f5',
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
        backgroundColor: COLORS.card || '#fff',
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
        minHeight: 80,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    itemDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 8,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    itemSku: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    itemQty: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
    },
    footer: {
        backgroundColor: COLORS.card || '#fff',
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
        opacity: 0.5,
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
    },
    staffEmail: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
});
