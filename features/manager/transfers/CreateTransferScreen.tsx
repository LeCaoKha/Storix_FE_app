import { Button, Card, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useCreateTransferOrder } from '@/hooks/transfer.hooks';
import { useWarehouses } from '@/hooks/warehouse.hooks';
import { AlertService } from '@/stores/alert.store';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

export default function CreateTransferScreen() {
    const router = useRouter();
    const { data: warehouses = [], isLoading: loadingWarehouses } = useWarehouses();
    const createMutation = useCreateTransferOrder();

    const [sourceId, setSourceId] = useState<number | null>(null);
    const [destId, setDestId] = useState<number | null>(null);

    const warehouseOptions = warehouses.map(w => ({
        label: w.name,
        value: w.id
    }));

    const handleCreate = () => {
        if (!sourceId || !destId) {
            AlertService.error('Lỗi', 'Vui lòng chọn đầy đủ kho xuất và kho nhập.');
            return;
        }

        if (sourceId === destId) {
            AlertService.error('Lỗi', 'Kho xuất và kho nhập không được trùng nhau.');
            return;
        }

        createMutation.mutate({
            sourceWarehouseId: sourceId,
            destinationWarehouseId: destId,
            submitAfterCreate: false
        }, {
            onSuccess: (data: any) => {
                AlertService.success('Thành công', 'Đã tạo phiếu luân chuyển.');
                // Backend usually returns the created transfer object with its new ID.
                router.replace(`/(manager-tabs)/transfers/${data.id}` as any);
            },
            onError: (error: any) => {
                AlertService.error('Lỗi', error.response?.data?.message || 'Không thể tạo phiếu.');
            }
        });
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Tạo luân chuyển kho"
                subtitle="Tạo luân chuyển giữa các kho"
            />
            
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <Card style={styles.card}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Kho xuất (Từ)</Text>
                        <Dropdown
                            style={styles.dropdown}
                            data={warehouseOptions}
                            labelField="label"
                            valueField="value"
                            placeholder="Chọn kho xuất..."
                            value={sourceId}
                            onChange={(item: { label: string; value: number }) => setSourceId(item.value)}
                            disable={loadingWarehouses}
                            renderLeftIcon={() => (
                                <Feather name="log-out" size={16} color={COLORS.danger} style={styles.icon} />
                            )}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Kho nhập (Đến)</Text>
                        <Dropdown
                            style={styles.dropdown}
                            data={warehouseOptions}
                            labelField="label"
                            valueField="value"
                            placeholder="Chọn kho nhập..."
                            value={destId}
                            onChange={(item: { label: string; value: number }) => setDestId(item.value)}
                            disable={loadingWarehouses}
                            renderLeftIcon={() => (
                                <Feather name="log-in" size={16} color={COLORS.success} style={styles.icon} />
                            )}
                        />
                    </View>
                </Card>
            </ScrollView>

            <View style={styles.footer}>
                <Button 
                    title="Hủy" 
                    variant="outline" 
                    onPress={() => router.back()} 
                    style={{ flex: 1 }} 
                />
                <Button 
                    title="Tạo phiếu luân chuyển" 
                    onPress={handleCreate} 
                    loading={createMutation.isPending}
                    style={{ flex: 1 }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    card: {
        padding: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    dropdown: {
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    icon: {
        marginRight: 8,
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: 12,
    },
});
