import { Card, RefreshContainer, SafeAreaHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useProducts } from '@/hooks/product.hooks';
import { useTranslation } from '@/hooks/useTranslation';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

export default function InventoryManagementScreen() {
    const { t } = useTranslation();
    const { data: products = [], isLoading, refetch } = useProducts();
    const [search, setSearch] = useState('');

    const handleRefresh = async () => {
        await refetch();
    };

    const filteredProducts = products.filter(p => 
        p.name?.toLowerCase().includes(search.toLowerCase()) || 
        p.sku?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <SafeAreaHeader backgroundColor="#fff" showBackButton={false}>
                <Text style={styles.headerTitle}>Quản lý tồn kho</Text>
            </SafeAreaHeader>

            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Feather name="search" size={18} color={COLORS.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('common.search')}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <RefreshContainer
                onRefresh={handleRefresh}
                contentContainerStyle={styles.listContent}
            >
                {isLoading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
                ) : filteredProducts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Feather name="package" size={64} color={COLORS.border} />
                        <Text style={styles.emptyText}>{t('common.noData')}</Text>
                    </View>
                ) : (
                    filteredProducts.map(product => (
                        <Card key={product.id} style={styles.productCard}>
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{product.name}</Text>
                                <Text style={styles.productSku}>SKU: {product.sku}</Text>
                            </View>
                            <View style={styles.qtyContainer}>
                                <Text style={styles.qtyValue}>{product.totalQuantity || 0}</Text>
                                <Text style={styles.qtyLabel}>{t('common.item').toLowerCase()}</Text>
                            </View>
                        </Card>
                    ))
                )}
            </RefreshContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    searchContainer: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12 },
    searchInput: { flex: 1, padding: 10, fontSize: 15, color: COLORS.text },
    listContent: { padding: 16 },
    loader: { marginTop: 40 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, fontSize: 16, color: COLORS.textMuted, fontWeight: '500' },
    productCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 12 },
    productInfo: { flex: 1, marginRight: 12 },
    productName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    productSku: { fontSize: 12, color: COLORS.textMuted },
    qtyContainer: { alignItems: 'flex-end', backgroundColor: COLORS.primary + '10', padding: 10, borderRadius: 12, minWidth: 70 },
    qtyValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
    qtyLabel: { fontSize: 10, color: COLORS.primary, fontWeight: '700', textTransform: 'uppercase' },
});
