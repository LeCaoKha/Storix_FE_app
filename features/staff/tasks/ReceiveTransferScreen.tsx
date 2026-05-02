import { Button, Card, RefreshContainer, ScreenHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import { useReceiveTransfer, useTransferOrder } from '@/hooks/transfer.hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { useTranslation } from '@/hooks/useTranslation';
import { AlertService } from '@/stores/alert.store';
import { ReceiveTransferItemRequest, ReceiveTransferOrderRequest } from '@/types/transfer';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReceiveTransferScreen() {
    const router = useRouter();
    const goBack = useAppBack();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const transferId = parseInt(id || '0', 10);
    const { t } = useTranslation();

    const { data: transfer, isLoading, refetch } = useTransferOrder(transferId);

    const handleRefresh = async () => {
        await refetch();
    };
    const receiveMutation = useReceiveTransfer();

    const [note, setNote] = useState('');
    const [receivedItems, setReceivedItems] = useState<Record<number, ReceiveTransferItemRequest>>({});

    // Initialize list when data is loaded
    useEffect(() => {
        if (transfer && transfer.items) {
            const initialItems: Record<number, ReceiveTransferItemRequest> = {};
            transfer.items.forEach(item => {
                if (item.productId) {
                    initialItems[item.productId] = {
                        productId: item.productId,
                        receivedQuantity: item.quantity,
                        damagedQuantity: 0
                    };
                }
            });
            setReceivedItems(initialItems);
        }
    }, [transfer]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>{t('common.loading')}</Text>
            </View>
        );
    }

    if (!transfer) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={64} color={COLORS.border} />
                    <Text style={styles.errorTitle}>{t('common.error')}</Text>
                    <Button title={t('common.back')} onPress={goBack} />
                </View>
            </View>
        );
    }

    const updateQuantity = (productId: number, field: 'receivedQuantity' | 'damagedQuantity', value: string) => {
        const numValue = parseInt(value || '0', 10);
        if (isNaN(numValue) || numValue < 0) return;

        setReceivedItems(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: numValue
            }
        }));
    };

    const handleReceive = () => {
        const payload: ReceiveTransferOrderRequest = {
            items: Object.values(receivedItems),
            note: note.trim() ? note.trim() : undefined
        };

        receiveMutation.mutate(
            { id: transferId, payload },
            {
                onSuccess: () => {
                    AlertService.success(t('common.success'), t('common.save'));
                    goBack();
                },
                onError: (error: any) => {
                    AlertService.error(t('common.error'), error.response?.data?.message || t('common.failed'));
                }
            }
        );
    };

    // Render Form Items
    const renderItem = (item: any) => {
        const productId = item.productId as number;
        const currentData = receivedItems[productId] || { receivedQuantity: 0, damagedQuantity: 0 };
        return (
            <View key={item.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                    <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
                    <Text style={styles.itemExpected}>{t('transfer.destinationWarehouse')}: {item.quantity} {item.unit || ''}</Text>
                </View>

                <View style={styles.inputsRow}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('transfer.receivedQty')}</Text>
                        <TextInput
                            style={styles.numericInput}
                            keyboardType="numeric"
                            value={String(currentData.receivedQuantity)}
                            onChangeText={(val) => updateQuantity(productId, 'receivedQuantity', val)}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('transfer.damagedQty')}</Text>
                        <TextInput
                            style={[styles.numericInput, styles.damageInput]}
                            keyboardType="numeric"
                            value={String(currentData.damagedQuantity)}
                            onChangeText={(val) => updateQuantity(productId, 'damagedQuantity', val)}
                        />
                    </View>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScreenHeader
                title={t('transfer.qualityCheck')}
                subtitle={`${t('common.item')} #${transfer.id}`}
            />

            <RefreshContainer 
                style={styles.content} 
                contentContainerStyle={[styles.contentContainer, { paddingBottom: 120 + insets.bottom }]}
                onRefresh={handleRefresh}
            >
                <Card style={styles.card}>
                    <View style={styles.infoRow}>
                        <Feather name="truck" size={20} color={COLORS.primary} />
                        <Text style={styles.infoText}>{t('transfer.sourceWarehouse')}: {transfer.sourceWarehouse?.name}</Text>
                    </View>
                </Card>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('putaway.placementLocation')}</Text>
                </View>
                
                <View style={styles.list}>
                    {(transfer.items || []).map((item: any, index: number) => (
                        <View key={item.id}>
                            {renderItem(item)}
                            {index < (transfer.items || []).length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>

                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <Text style={styles.sectionTitle}>{t('outbound.productList')}</Text>
                </View>
                <Card style={styles.card}>
                    <TextInput
                        style={styles.noteInput}
                        placeholder={t('common.note')}
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={3}
                    />
                </Card>
            </RefreshContainer>

            <View style={[styles.actionBar, { paddingBottom: getBottomSafePadding(insets.bottom, 16) }]}>
                <Button 
                    title={t('transfer.confirmSave')} 
                    onPress={handleReceive} 
                    loading={receiveMutation.isPending} 
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    errorTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 20, marginBottom: 16 },
    content: { flex: 1 },
    contentContainer: { padding: 20 },
    card: { marginBottom: 16, padding: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    infoText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    list: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
    itemContainer: { padding: 16 },
    itemHeader: { marginBottom: 12 },
    productName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    itemExpected: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
    inputsRow: { flexDirection: 'row', gap: 16 },
    inputGroup: { flex: 1 },
    inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6 },
    numericInput: { height: 44, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, fontWeight: '600', color: COLORS.text, backgroundColor: '#FAFAFA' },
    damageInput: { borderColor: '#FECACA', color: COLORS.danger },
    divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },
    noteInput: { minHeight: 80, textAlignVertical: 'top', fontSize: 15 },
    actionBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16,
        borderTopWidth: 1, borderTopColor: COLORS.border,
        elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1, shadowRadius: 12,
    }
});
