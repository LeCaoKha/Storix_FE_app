import { Card, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useCreateInboundTicket, useInboundRequest } from '@/hooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateInboundOrderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const requestId = params.requestId as string;

    const { data: inboundRequest, isLoading: isLoadingRequest } = useInboundRequest(requestId);
    const { mutateAsync: createInboundTicket } = useCreateInboundTicket();

    const [supplier, setSupplier] = useState('');
    const [supplierContact, setSupplierContact] = useState('');
    const [poReference, setPOReference] = useState('');
    const [expectedDate, setExpectedDate] = useState(new Date());
    const [notes, setNotes] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (inboundRequest) {
            // Set supplier from inboundRequest if available
            setSupplier(inboundRequest.supplier?.name || '');
        }
    }, [inboundRequest]);

    const handleCreate = async () => {
        if (!supplier.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên nhà cung cấp');
            return;
        }

        setIsCreating(true);
        try {
            // Create inbound ticket from the approved request
            const payload = {
                inboundRequestId: inboundRequest?.id || parseInt(requestId),
                items: inboundRequest?.items?.map(item => ({
                    productId: item.productId,
                    expectedQuantity: item.expectedQuantity,
                    actualQuantity: 0,
                })) || []
            };

            const created = await createInboundTicket(payload);

            Alert.alert('Thành công', 'Đã tạo đơn nhập kho', [
                {
                    text: 'OK',
                    onPress: () => {
                        router.back();
                        router.push(`/(manager-tabs)/(orders-inbound)/${created.id}` as any);
                    },
                },
            ]);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tạo đơn nhập kho');
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
                {inboundRequest && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Từ Yêu Cầu Nhập Kho</Text>
                        <Text style={styles.requisitionNumber}>Request #{inboundRequest.id}</Text>
                        <Text style={styles.requisitionPurpose}>Trạng thái: {inboundRequest.status}</Text>
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
