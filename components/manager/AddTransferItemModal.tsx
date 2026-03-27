import { Button, ProductPickerModal } from '@/components';
import { getBottomSafePadding, getTopSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import { Product } from '@/types/product';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AddTransferItemModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (productId: number, quantity: number) => void;
    isAdding: boolean;
}

export const AddTransferItemModal: React.FC<AddTransferItemModalProps> = ({ visible, onClose, onAdd, isAdding }) => {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState('1');
    const insets = useSafeAreaInsets();

    const handleAdd = () => {
        if (!selectedProduct) return;
        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty <= 0) return;
        onAdd(selectedProduct.id, qty);
    };

    const handleClose = () => {
        setSelectedProduct(null);
        setQuantity('1');
        onClose();
    };

    return (
        <>
            <ProductPickerModal
                visible={visible && !selectedProduct}
                onClose={handleClose}
                onSelect={setSelectedProduct}
                title="Chọn sản phẩm luân chuyển"
            />

            <Modal visible={visible && !!selectedProduct} animationType="slide" onRequestClose={handleClose}>
                <View style={styles.container}>
                    <View style={[styles.header, { paddingTop: getTopSafePadding(insets.top, 12) }]}>
                        <Text style={styles.title}>Thêm sản phẩm luân chuyển</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Feather name="x" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.selectedContainer, { paddingBottom: getBottomSafePadding(insets.bottom, 20) }]}>
                        <View style={styles.selectedProductInfo}>
                            <Text style={styles.productName}>{selectedProduct?.name}</Text>
                            <Text style={styles.productSku}>SKU: {selectedProduct?.sku || 'N/A'}</Text>
                            <Text style={styles.productUnit}>Đơn vị: {selectedProduct?.unit || 'Cái'}</Text>
                        </View>
                        <TouchableOpacity style={styles.clearBtn} onPress={() => setSelectedProduct(null)}>
                            <Text style={styles.clearBtnText}>Đổi sản phẩm khác</Text>
                        </TouchableOpacity>

                        <Text style={styles.label}>Số lượng cần luân chuyển</Text>
                        <TextInput
                            style={styles.input}
                            value={quantity}
                            onChangeText={setQuantity}
                            keyboardType="numeric"
                        />

                        <View style={styles.actions}>
                            <Button title="Quay lại" variant="outline" onPress={() => setSelectedProduct(null)} style={{ flex: 1, marginRight: 8 }} />
                            <Button
                                title="Thêm vào danh sách"
                                onPress={handleAdd}
                                loading={isAdding}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    selectedContainer: {
        padding: 20,
    },
    selectedProductInfo: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    productSku: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    productUnit: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 6,
    },
    clearBtn: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    clearBtnText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 24,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
