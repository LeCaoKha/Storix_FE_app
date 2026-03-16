import { COLORS } from '@/constants/color';
import { useProducts } from '@/hooks/product.hooks';
import { getLatestPrice, Product } from '@/types/product';
import { formatVND } from '@/utils/format';
import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBottomSafePadding, getTopSafePadding } from './safeArea';

interface ProductPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (product: Product) => void;
    title?: string;
    excludedProductIds?: number[];
}

export const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
    visible,
    onClose,
    onSelect,
    title = 'Chọn sản phẩm',
    excludedProductIds = [],
}) => {
    const { data: products = [], isLoading } = useProducts();
    const [search, setSearch] = useState('');
    const insets = useSafeAreaInsets();

    const filteredProducts = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return products.filter((product) => {
            if (excludedProductIds.includes(product.id)) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            return (
                product.name?.toLowerCase().includes(keyword) ||
                product.sku?.toLowerCase().includes(keyword)
            );
        });
    }, [excludedProductIds, products, search]);

    const handleClose = () => {
        setSearch('');
        onClose();
    };

    const handleSelect = (product: Product) => {
        setSearch('');
        onSelect(product);
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <View style={styles.modalContainer}>
                <View style={[styles.modalHeader, { paddingTop: getTopSafePadding(insets.top, 12) }]}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={handleClose}>
                        <Feather name="x" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.modalSearch}>
                    <Feather name="search" size={18} color={COLORS.textMuted} />
                    <TextInput
                        style={styles.modalSearchInput}
                        placeholder="Tìm kiếm sản phẩm, SKU..."
                        value={search}
                        onChangeText={setSearch}
                        placeholderTextColor={COLORS.textMuted}
                    />
                </View>

                {isLoading ? (
                    <View style={styles.centerState}>
                        <Text>Đang tải sản phẩm...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredProducts}
                        keyExtractor={(item, index) => `product-${item.id}-${index}`}
                        renderItem={({ item }) => {
                            const latestPrice = getLatestPrice(item);

                            return (
                                <TouchableOpacity
                                    style={styles.productItem}
                                    onPress={() => handleSelect(item)}
                                >
                                    <View style={styles.productIcon}>
                                        {item.image ? (
                                            <Image
                                                source={{ uri: item.image }}
                                                style={styles.productImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Feather name="package" size={20} color={COLORS.primary} />
                                        )}
                                    </View>
                                    <View style={styles.productInfo}>
                                        <Text style={styles.productName}>{item.name}</Text>
                                        <Text style={styles.productSku}>SKU: {item.sku || 'N/A'}</Text>
                                        <Text style={styles.productStock}>Đơn vị: {item.unit || 'Cái'}</Text>
                                        {item.productPrices && item.productPrices.length > 0 && (
                                            <View style={styles.priceRowModal}>
                                                <Feather name="tag" size={12} color="#22C55E" />
                                                <Text style={styles.productPriceText}>{formatVND(latestPrice)}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Feather name="plus-circle" size={24} color={COLORS.primary} />
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Feather name="inbox" size={28} color={COLORS.border} />
                                <Text style={styles.emptyText}>Không tìm thấy sản phẩm phù hợp.</Text>
                            </View>
                        }
                        contentContainerStyle={[styles.productList, { paddingBottom: getBottomSafePadding(insets.bottom, 24) }]}
                    />
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    modalSearch: {
        margin: 20,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 48,
    },
    modalSearchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: COLORS.text,
    },
    centerState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productList: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    productIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    productInfo: {
        flex: 1,
        marginRight: 12,
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    productSku: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '500',
        marginBottom: 2,
    },
    productStock: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    priceRowModal: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    productPriceText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#16A34A',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 10,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
});