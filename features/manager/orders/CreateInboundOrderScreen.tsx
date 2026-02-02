import { Card } from '@/components/ui/Card';
import { SafeAreaHeader } from '@/components/ui/SafeAreaHeader';
import { COLORS } from '@/constants/color';
import { useInboundOrders } from '@/contexts/InboundOrderContext';
import { useRequisitions } from '@/contexts/RequisitionContext';
import { InboundOrder } from '@/types/inbound-order';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateInboundOrderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const requisitionId = params.requisitionId as string;

    const { getRequisitionById, linkOrderToRequisition } = useRequisitions();
    const { createInboundOrder } = useInboundOrders();

    const requisition = requisitionId ? getRequisitionById(requisitionId) : null;

    const [supplier, setSupplier] = useState(requisition?.supplier || '');
    const [supplierContact, setSupplierContact] = useState('');
    const [poReference, setPOReference] = useState('');
    const [expectedDate, setExpectedDate] = useState(new Date());
    const [notes, setNotes] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!supplier.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên nhà cung cấp');
            return;
        }

        setIsCreating(true);
        try {
            const newOrder: Omit<InboundOrder, 'id' | 'inboundNumber' | 'createdAt'> = {
                requisitionId: requisition?.id,
                requisitionNumber: requisition?.requisitionNumber,
                supplier: supplier.trim(),
                supplierContact: supplierContact.trim() || undefined,
                poReference: poReference.trim() || undefined,
                warehouse: requisition?.warehouse || 'Warehouse Central',
                items: requisition?.items.map(item => ({
                    id: `inb-item-${Date.now()}-${item.id}`,
                    sku: item.sku,
                    productName: item.productName,
                    expectedQty: item.quantity,
                    receivedQty: 0,
                    unit: item.unit,
                    batchNumber: item.batchNumber,
                    lotNumber: item.lotNumber,
                    expiryDate: item.expiryDate,
                })) || [],
                status: 'scheduled',
                expectedArrivalDate: expectedDate,
                createdBy: 'mgr-001',
                createdByName: 'Manager Name',
                notes: notes.trim() || undefined,
            };

            const created = await createInboundOrder(newOrder);

            // Link order to requisition
            if (requisition) {
                await linkOrderToRequisition(requisition.id, created.id, created.inboundNumber);
            }

            Alert.alert('Thành công', 'Đã tạo đơn nhập kho', [
                {
                    text: 'OK',
                    onPress: () => {
                        router.back();
                        router.push(`/manager/orders/inbound/${created.id}` as any);
                    },
                },
            ]);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tạo đơn nhập kho');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            {/* Header */}
            <SafeAreaHeader backgroundColor="#fff" showBackButton style={styles.header}>
                <Text style={styles.title}>Tạo Đơn Nhập Kho</Text>
            </SafeAreaHeader>

            <ScrollView style={styles.content}>
                {requisition && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Từ Đề Xuất</Text>
                        <Text style={styles.requisitionNumber}>{requisition.requisitionNumber}</Text>
                        <Text style={styles.requisitionPurpose}>{requisition.purpose}</Text>
                    </Card>
                )}

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Thông Tin Nhà Cung Cấp</Text>

                    <Text style={styles.label}>Nhà cung cấp *</Text>
                    <TextInput
                        style={styles.input}
                        value={supplier}
                        onChangeText={setSupplier}
                        placeholder="Nhập tên nhà cung cấp"
                        placeholderTextColor={COLORS.textMuted}
                    />

                    <Text style={styles.label}>Số điện thoại</Text>
                    <TextInput
                        style={styles.input}
                        value={supplierContact}
                        onChangeText={setSupplierContact}
                        placeholder="Nhập số điện thoại"
                        keyboardType="phone-pad"
                        placeholderTextColor={COLORS.textMuted}
                    />

                    <Text style={styles.label}>Mã PO</Text>
                    <TextInput
                        style={styles.input}
                        value={poReference}
                        onChangeText={setPOReference}
                        placeholder="Nhập mã Purchase Order"
                        placeholderTextColor={COLORS.textMuted}
                    />
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Ghi Chú</Text>
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

                {requisition && requisition.items.length > 0 && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            Sản Phẩm ({requisition.items.length})
                        </Text>
                        {requisition.items.map(item => (
                            <View key={item.id} style={styles.itemRow}>
                                <Text style={styles.itemName}>{item.productName}</Text>
                                <Text style={styles.itemQty}>
                                    {item.quantity} {item.unit}
                                </Text>
                            </View>
                        ))}
                    </Card>
                )}
            </ScrollView>

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
    textArea: {
        minHeight: 100,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        marginTop: 8,
    },
    itemName: {
        flex: 1,
        fontSize: 13,
        color: COLORS.text,
    },
    itemQty: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
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
        opacity: 0.5,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
