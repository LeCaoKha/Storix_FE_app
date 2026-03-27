import { Button, Card, ScreenHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import { useCreateTransferOrder, useTransferOrders } from '@/hooks/transfer.hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { useWarehouses } from '@/hooks/warehouse.hooks';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateTransferScreen() {
    const router = useRouter();
    const goBack = useAppBack('/(manager-tabs)/transfers');
    const insets = useSafeAreaInsets();
    const user = useAuthStore((state) => state.user);
    const roleId = user?.roleId;
    const canCreateTransfer = roleId === 3;
    const { data: warehouses = [], isLoading: loadingWarehouses } = useWarehouses();
    const { data: transferHistory = [], isLoading: loadingTransfers } = useTransferOrders({}, canCreateTransfer);
    const createMutation = useCreateTransferOrder();

    const [sourceId, setSourceId] = useState<number | null>(null);
    const [destId, setDestId] = useState<number | null>(null);
    const [manualDestId, setManualDestId] = useState('');

    const warehouseMap = useMemo(() => {
        const map = new Map<number, string>();

        warehouses.forEach((warehouse) => {
            map.set(warehouse.id, warehouse.name);
        });

        transferHistory.forEach((transfer) => {
            if (transfer.sourceWarehouseId && !map.has(transfer.sourceWarehouseId)) {
                map.set(transfer.sourceWarehouseId, transfer.sourceWarehouse?.name || `Kho #${transfer.sourceWarehouseId}`);
            }
            if (transfer.destinationWarehouseId && !map.has(transfer.destinationWarehouseId)) {
                map.set(
                    transfer.destinationWarehouseId,
                    transfer.destinationWarehouse?.name || `Kho #${transfer.destinationWarehouseId}`
                );
            }
        });

        if (user?.warehouseId && !map.has(user.warehouseId)) {
            map.set(user.warehouseId, user.warehouseName || `Kho #${user.warehouseId}`);
        }

        return map;
    }, [transferHistory, user?.warehouseId, user?.warehouseName, warehouses]);

    const allWarehouseOptions = useMemo(
        () =>
            Array.from(warehouseMap.entries()).map(([id, name]) => ({
                label: name,
                value: id,
            })),
        [warehouseMap]
    );

    const sourceOptions = useMemo(() => {
        if (user?.warehouseId) {
            const label = warehouseMap.get(user.warehouseId) || user.warehouseName || `Kho #${user.warehouseId}`;
            return [{ label, value: user.warehouseId }];
        }
        return allWarehouseOptions;
    }, [allWarehouseOptions, user?.warehouseId, user?.warehouseName, warehouseMap]);

    const destinationOptions = useMemo(
        () => allWarehouseOptions.filter((option) => option.value !== sourceId),
        [allWarehouseOptions, sourceId]
    );

    const recentDestinationOptions = useMemo(() => {
        const seen = new Set<number>();
        return [...transferHistory]
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .map((transfer) => transfer.destinationWarehouseId)
            .filter((id): id is number => !!id)
            .filter((id) => {
                if (id === sourceId || seen.has(id)) {
                    return false;
                }
                seen.add(id);
                return true;
            })
            .slice(0, 5)
            .map((id) => ({
                id,
                label: warehouseMap.get(id) || `Kho #${id}`,
            }));
    }, [sourceId, transferHistory, warehouseMap]);

    useEffect(() => {
        if (user?.warehouseId) {
            setSourceId(user.warehouseId);
            return;
        }

        if (!sourceId && sourceOptions.length > 0) {
            setSourceId(sourceOptions[0].value);
        }
    }, [sourceId, sourceOptions, user?.warehouseId]);

    useEffect(() => {
        if (!manualDestId.trim()) {
            return;
        }

        const parsed = Number.parseInt(manualDestId, 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
            setDestId(parsed);
        }
    }, [manualDestId]);

    const handleCreate = () => {
        if (!canCreateTransfer) {
            AlertService.error('Không có quyền', 'Chỉ Manager mới có quyền tạo phiếu luân chuyển.');
            return;
        }

        const parsedManualDest = Number.parseInt(manualDestId, 10);
        const resolvedDestId = Number.isNaN(parsedManualDest) ? destId : parsedManualDest;

        if (!sourceId || !resolvedDestId) {
            AlertService.error('Lỗi', 'Vui lòng chọn đầy đủ kho xuất và kho nhập.');
            return;
        }

        if (sourceId === resolvedDestId) {
            AlertService.error('Lỗi', 'Kho xuất và kho nhập không được trùng nhau.');
            return;
        }

        createMutation.mutate({
            sourceWarehouseId: sourceId,
            destinationWarehouseId: resolvedDestId,
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
            
            <ScrollView style={styles.content} contentContainerStyle={[styles.contentContainer, { paddingBottom: 120 + insets.bottom }]}>
                <Card style={styles.card}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Kho xuất (Từ)</Text>
                        <Dropdown
                            style={styles.dropdown}
                            data={sourceOptions}
                            labelField="label"
                            valueField="value"
                            placeholder={loadingWarehouses ? 'Đang tải kho...' : 'Chọn kho xuất...'}
                            value={sourceId}
                            onChange={(item: { label: string; value: number }) => setSourceId(item.value)}
                            disable={loadingWarehouses || !!user?.warehouseId}
                            renderLeftIcon={() => (
                                <Feather name="log-out" size={16} color={COLORS.danger} style={styles.icon} />
                            )}
                        />
                        {!!user?.warehouseId && (
                            <Text style={styles.helperText}>Kho xuất được cố định theo kho được gán cho manager.</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Kho nhập (Đến)</Text>
                        <Dropdown
                            style={styles.dropdown}
                            data={destinationOptions}
                            labelField="label"
                            valueField="value"
                            placeholder={loadingTransfers ? 'Đang tải gợi ý kho...' : 'Chọn kho nhập...'}
                            value={destId}
                            onChange={(item: { label: string; value: number }) => {
                                setDestId(item.value);
                                setManualDestId(String(item.value));
                            }}
                            disable={loadingWarehouses || loadingTransfers}
                            renderLeftIcon={() => (
                                <Feather name="log-in" size={16} color={COLORS.success} style={styles.icon} />
                            )}
                        />
                        <Text style={styles.helperText}>Nếu không thấy kho đích trong danh sách, nhập mã kho đích bên dưới.</Text>
                        <TextInput
                            style={styles.manualInput}
                            value={manualDestId}
                            onChangeText={(text) => {
                                const digitsOnly = text.replace(/[^0-9]/g, '');
                                setManualDestId(digitsOnly);

                                if (!digitsOnly) {
                                    setDestId(null);
                                    return;
                                }

                                const parsed = Number.parseInt(digitsOnly, 10);
                                setDestId(Number.isNaN(parsed) ? null : parsed);
                            }}
                            keyboardType="number-pad"
                            placeholder="Nhập mã kho đích (VD: 15)"
                            placeholderTextColor={COLORS.textMuted}
                        />
                        {recentDestinationOptions.length > 0 && (
                            <View style={styles.recentSection}>
                                <Text style={styles.recentTitle}>Kho đích gần đây</Text>
                                <View style={styles.chipsWrap}>
                                    {recentDestinationOptions.map((recent) => {
                                        const active = destId === recent.id;
                                        return (
                                            <TouchableOpacity
                                                key={`recent-dest-${recent.id}`}
                                                style={[styles.chip, active && styles.chipActive]}
                                                onPress={() => {
                                                    setDestId(recent.id);
                                                    setManualDestId(String(recent.id));
                                                }}
                                            >
                                                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                                    {recent.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                    </View>
                </Card>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: getBottomSafePadding(insets.bottom, 16) }]}>
                <Button 
                    title="Hủy" 
                    variant="outline" 
                    onPress={goBack} 
                    style={{ flex: 1 }} 
                />
                <Button 
                    title="Tạo phiếu luân chuyển" 
                    onPress={handleCreate} 
                    loading={createMutation.isPending}
                    disabled={!canCreateTransfer || !sourceId}
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
    helperText: {
        marginTop: 8,
        color: COLORS.textMuted,
        fontSize: 12,
    },
    manualInput: {
        marginTop: 10,
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        color: COLORS.text,
    },
    recentSection: {
        marginTop: 12,
    },
    recentTitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 8,
    },
    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#fff',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    chipActive: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}15`,
    },
    chipText: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: '500',
    },
    chipTextActive: {
        color: COLORS.primary,
        fontWeight: '700',
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
