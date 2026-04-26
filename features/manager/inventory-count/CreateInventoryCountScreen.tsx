import { Button, Card, RefreshContainer, SafeAreaHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import { useCreateStockCountTicket } from '@/hooks/stock-count.hooks';
import { useProducts } from '@/hooks/product.hooks';
import { useWarehouses } from '@/hooks/warehouse.hooks';
import { useWarehouseStaff } from '@/hooks/user.hooks';
import { useTranslation } from '@/hooks/useTranslation';
import { AlertService } from '@/stores/alert.store';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateInventoryCountScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const createMutation = useCreateStockCountTicket();

    const { data: warehouses = [], isLoading: loadingWarehouses } = useWarehouses();
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>();
    const { data: staff = [], isLoading: loadingStaff } = useWarehouseStaff(selectedWarehouseId || 0);
    const { data: products = [], isLoading: loadingProducts } = useProducts();

    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [assignedStaffId, setAssignedStaffId] = useState<number | undefined>();
    const [countType, setCountType] = useState<'Blind' | 'Standard'>('Standard');
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [searchProduct, setSearchProduct] = useState('');

    const filteredProducts = products.filter(p => 
        p.name?.toLowerCase().includes(searchProduct.toLowerCase()) || 
        p.sku?.toLowerCase().includes(searchProduct.toLowerCase())
    );

    const toggleProduct = (id: number) => {
        setSelectedProductIds(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleCreate = () => {
        if (!selectedWarehouseId) {
            AlertService.error(t('common.error'), 'Vui lòng chọn kho hàng.');
            return;
        }
        if (selectedProductIds.length === 0) {
            AlertService.error(t('common.error'), 'Vui lòng chọn ít nhất 1 sản phẩm.');
            return;
        }

        createMutation.mutate({
            warehouseId: selectedWarehouseId,
            assignedStaffId,
            name: name.trim() || undefined,
            description: description.trim() || undefined,
            type: countType,
            productIds: selectedProductIds,
            executedDay: new Date().toISOString(),
        }, {
            onSuccess: () => {
                AlertService.success(t('common.success'), 'Đã tạo phiếu kiểm kê mới.');
                router.replace('/(manager-tabs)/inventory-count');
            },
            onError: (error: any) => {
                AlertService.error(t('common.error'), error.response?.data?.message || t('common.failed'));
            }
        });
    };

    return (
        <View style={styles.container}>
            <SafeAreaHeader backgroundColor="#fff" onBack={() => step > 1 ? setStep(1) : router.back()}>
                <Text style={styles.headerTitle}>{t('inventoryCount.createTicket')}</Text>
            </SafeAreaHeader>

            <View style={styles.stepper}>
                <View style={[styles.stepItem, step >= 1 && styles.activeStep]}>
                    <Text style={[styles.stepText, step >= 1 && styles.activeStepText]}>1</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={[styles.stepItem, step >= 2 && styles.activeStep]}>
                    <Text style={[styles.stepText, step >= 2 && styles.activeStepText]}>2</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {step === 1 ? (
                    <View>
                        <Text style={styles.label}>{t('inventoryCount.ticketName')} ({t('common.undo').toLowerCase()})</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('inventoryCount.ticketName')}
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>{t('tasks.warehouse')} *</Text>
                        <View style={styles.pickerContainer}>
                            {loadingWarehouses ? <ActivityIndicator size="small" /> : (
                                warehouses.map(w => (
                                    <TouchableOpacity 
                                        key={w.id} 
                                        style={[styles.pickerItem, selectedWarehouseId === w.id && styles.activePickerItem]}
                                        onPress={() => setSelectedWarehouseId(w.id)}
                                    >
                                        <Text style={[styles.pickerText, selectedWarehouseId === w.id && styles.activePickerText]}>{w.name}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>

                        <Text style={styles.label}>{t('inventoryCount.assignedStaff')} ({t('common.undo').toLowerCase()})</Text>
                        <View style={styles.pickerContainer}>
                            {loadingStaff ? <ActivityIndicator size="small" /> : (
                                staff.map(s => (
                                    <TouchableOpacity 
                                        key={s.id} 
                                        style={[styles.pickerItem, assignedStaffId === s.id && styles.activePickerItem]}
                                        onPress={() => setAssignedStaffId(s.id)}
                                    >
                                        <Text style={[styles.pickerText, assignedStaffId === s.id && styles.activePickerText]}>{s.fullName || s.email}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>

                        <Text style={styles.label}>{t('inventoryCount.countType')}</Text>
                        <View style={styles.typeRow}>
                            <TouchableOpacity 
                                style={[styles.typeBtn, countType === 'Standard' && styles.activeTypeBtn]}
                                onPress={() => setCountType('Standard')}
                            >
                                <Feather name="check-circle" size={18} color={countType === 'Standard' ? '#fff' : COLORS.textMuted} />
                                <Text style={[styles.typeBtnText, countType === 'Standard' && styles.activeTypeBtnText]}>{t('inventoryCount.standardCount')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.typeBtn, countType === 'Blind' && styles.activeTypeBtn]}
                                onPress={() => setCountType('Blind')}
                            >
                                <Feather name="eye-off" size={18} color={countType === 'Blind' ? '#fff' : COLORS.textMuted} />
                                <Text style={[styles.typeBtnText, countType === 'Blind' && styles.activeTypeBtnText]}>{t('inventoryCount.blindCountMode')}</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>{t('inventoryCount.notes')}</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder={t('inventoryCount.notes')}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                    </View>
                ) : (
                    <View>
                        <Text style={styles.label}>{t('inventoryCount.selectProducts')} ({selectedProductIds.length})</Text>
                        <View style={styles.searchBox}>
                            <Feather name="search" size={18} color={COLORS.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('common.search')}
                                value={searchProduct}
                                onChangeText={setSearchProduct}
                            />
                        </View>

                        {loadingProducts ? <ActivityIndicator size="large" /> : (
                            <View style={styles.productList}>
                                {filteredProducts.map(p => (
                                    <TouchableOpacity 
                                        key={p.id} 
                                        style={[styles.productItem, selectedProductIds.includes(p.id) && styles.activeProductItem]}
                                        onPress={() => toggleProduct(p.id)}
                                    >
                                        <View style={styles.productInfo}>
                                            <Text style={styles.productName}>{p.name}</Text>
                                            <Text style={styles.productSku}>SKU: {p.sku}</Text>
                                        </View>
                                        {selectedProductIds.includes(p.id) && (
                                            <Feather name="check-circle" size={20} color={COLORS.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            <View style={[styles.actionBar, { paddingBottom: getBottomSafePadding(insets.bottom, 16) }]}>
                {step === 1 ? (
                    <Button 
                        title={t('common.continue')}
                        onPress={() => setStep(2)} 
                        disabled={!selectedWarehouseId}
                    />
                ) : (
                    <View style={styles.actionRow}>
                        <Button 
                            title={t('common.back')}
                            variant="outline" 
                            onPress={() => setStep(1)} 
                            style={{ flex: 1 }}
                        />
                        <Button 
                            title={t('common.create')}
                            onPress={handleCreate} 
                            loading={createMutation.isPending}
                            style={{ flex: 2 }}
                            disabled={selectedProductIds.length === 0}
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    stepItem: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
    activeStep: { backgroundColor: COLORS.primary },
    stepText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMuted },
    activeStepText: { color: '#fff' },
    stepLine: { width: 40, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 10 },
    content: { padding: 20, paddingBottom: 120 },
    label: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 16 },
    pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pickerItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
    activePickerItem: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    pickerText: { fontSize: 13, color: COLORS.text },
    activePickerText: { color: '#fff', fontWeight: '600' },
    typeRow: { flexDirection: 'row', gap: 12 },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
    activeTypeBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    typeBtnText: { fontWeight: '600', color: COLORS.textMuted },
    activeTypeBtnText: { color: '#fff' },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
    searchInput: { flex: 1, padding: 10, fontSize: 15 },
    productList: { gap: 10 },
    productItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
    activeProductItem: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '05' },
    productInfo: { flex: 1 },
    productName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
    productSku: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border },
    actionRow: { flexDirection: 'row', gap: 12 },
});
