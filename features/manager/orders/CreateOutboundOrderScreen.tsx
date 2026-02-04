import { Card } from '@/components';
import { COLORS } from '@/constants/color';
import { useCreateOutboundOrder, useLinkOrderToRequisition, useRequisition } from '@/hooks';
import { OutboundOrder } from '@/types/outbound-order';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateOutboundOrderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const requisitionId = params.requisitionId as string;

    const { data: requisition, isLoading: isLoadingRequisition } = useRequisition(requisitionId);
    const { mutateAsync: linkOrder } = useLinkOrderToRequisition();
    const { mutateAsync: createOutboundOrder } = useCreateOutboundOrder();

    const [customer, setCustomer] = useState('');
    const [customerContact, setCustomerContact] = useState('');
    const [destination, setDestination] = useState('');
    const [salesOrderRef, setSalesOrderRef] = useState('');
    const [expectedDate, setExpectedDate] = useState(new Date());
    const [notes, setNotes] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (requisition) {
            // In a real app, customer info might come from the requisition or a separate service
            // setCustomer(requisition.customer || ''); 
        }
    }, [requisition]);

    const handleCreate = async () => {
        if (!customer.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên khách hàng');
            return;
        }
        if (!destination.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ giao hàng');
            return;
        }

        setIsCreating(true);
        try {
            const newOrder: Omit<OutboundOrder, 'id' | 'outboundNumber' | 'createdAt'> = {
                requisitionId: requisition?.id ? String(requisition.id) : undefined,
                requisitionNumber: requisition?.requisitionNumber,
                customer: customer.trim(),
                customerContact: customerContact.trim() || undefined,
                destination: destination.trim(),
                salesOrderRef: salesOrderRef.trim() || undefined,
                warehouse: requisition?.warehouse || 'Warehouse Central',
                items: requisition?.items.map(item => ({
                    id: `out-item-${Date.now()}-${item.id}`,
                    sku: item.sku,
                    productName: item.productName,
                    qtyToPick: item.quantity,
                    qtyPicked: 0,
                    unit: item.unit,
                    pickLocations: [
                        {
                            locationId: `loc-${item.sku}`,
                            locationCode: 'A-01-01', // Default location
                            quantity: item.quantity,
                            sequence: 1,
                        },
                    ],
                    batchNumber: item.batchNumber,
                    lotNumber: item.lotNumber,
                })) || [],
                optimizedRoute: ['A-01-01'], // Simplified route
                status: 'open',
                expectedShipDate: expectedDate,
                createdBy: 'mgr-001',
                createdByName: 'Manager Name',
                notes: notes.trim() || undefined,
            };

            const created = await createOutboundOrder(newOrder);

            // Link order to requisition
            if (requisition) {
                await linkOrder({
                    requisitionId: requisition.id,
                    orderId: created.id,
                    orderNumber: created.outboundNumber
                });
            }

            Alert.alert('Thành công', 'Đã tạo đơn xuất kho', [
                {
                    text: 'OK',
                    onPress: () => {
                        router.back();
                        router.push(`/(manager-tabs)/(orders-outbound)/${created.id}` as any);
                    },
                },
            ]);
        } catch (error) {
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Tạo Đơn Xuất Kho</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                {requisition && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Từ Đề Xuất</Text>
                        <Text style={styles.requisitionNumber}>{requisition.requisitionNumber}</Text>
                        <Text style={styles.requisitionPurpose}>{requisition.purpose}</Text>
                    </Card>
                )}

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Thông Tin Khách Hàng</Text>

                    <Text style={styles.label}>Khách hàng *</Text>
                    <TextInput
                        style={styles.input}
                        value={customer}
                        onChangeText={setCustomer}
                        placeholder="Nhập tên khách hàng"
                        placeholderTextColor={COLORS.textMuted}
                    />

                    <Text style={styles.label}>Số điện thoại</Text>
                    <TextInput
                        style={styles.input}
                        value={customerContact}
                        onChangeText={setCustomerContact}
                        placeholder="Nhập số điện thoại"
                        keyboardType="phone-pad"
                        placeholderTextColor={COLORS.textMuted}
                    />

                    <Text style={styles.label}>Địa chỉ giao hàng *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={destination}
                        onChangeText={setDestination}
                        placeholder="Nhập địa chỉ giao hàng"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        placeholderTextColor={COLORS.textMuted}
                    />

                    <Text style={styles.label}>Mã SO</Text>
                    <TextInput
                        style={styles.input}
                        value={salesOrderRef}
                        onChangeText={setSalesOrderRef}
                        placeholder="Nhập mã Sales Order"
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
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 4,
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
        backgroundColor: COLORS.card,
    },
    textArea: {
        minHeight: 80,
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
        backgroundColor: COLORS.card,
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
        color: COLORS.textLight,
    },
});
