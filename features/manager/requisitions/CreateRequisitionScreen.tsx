import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants/color';
import { useRequisitions } from '@/contexts/RequisitionContext';
import { mockProducts, type Product } from '@/mock/products';
import type { RequisitionItem, RequisitionType } from '@/types/requisition';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CreateRequisitionScreen() {
    const router = useRouter();
    const { createRequisition, loading } = useRequisitions();
    const [type, setType] = useState<RequisitionType>('inbound');
    const [purpose, setPurpose] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<RequisitionItem[]>([]);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    const filteredProducts = mockProducts.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())
    );

    const handleAddProduct = (product: Product) => {
        // Check if already added
        if (items.some(item => item.sku === product.sku)) {
            Alert.alert('Thông báo', 'Sản phẩm đã có trong danh sách');
            return;
        }

        const newItem: RequisitionItem = {
            id: `item-${Date.now()}`,
            sku: product.sku,
            productName: product.name,
            quantity: 1,
            unit: product.unit,
        };

        setItems([...items, newItem]);
        setShowProductPicker(false);
        setProductSearch('');
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleUpdateQuantity = (id: string, quantity: string) => {
        const numQuantity = parseInt(quantity) || 0;
        setItems(items.map(item =>
            item.id === id ? { ...item, quantity: numQuantity } : item
        ));
    };

    const handleSubmit = async () => {
        // Validation
        if (!purpose.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập mục đích');
            return;
        }

        if (!expectedDate.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập ngày dự kiến');
            return;
        }

        if (items.length === 0) {
            Alert.alert('Lỗi', 'Vui lòng thêm ít nhất một sản phẩm');
            return;
        }

        if (items.some(item => item.quantity <= 0)) {
            Alert.alert('Lỗi', 'Số lượng phải lớn hơn 0');
            return;
        }

        // Check stock for outbound
        if (type === 'outbound') {
            const insufficientStock = items.filter(item => {
                const product = mockProducts.find(p => p.sku === item.sku);
                return product && product.stockLevel < item.quantity;
            });

            if (insufficientStock.length > 0) {
                Alert.alert(
                    'Cảnh báo tồn kho',
                    `Một số sản phẩm không đủ tồn kho:\n${insufficientStock
                        .map(item => `- ${item.productName}`)
                        .join('\n')}\n\nBạn có muốn tiếp tục?`,
                    [
                        { text: 'Hủy', style: 'cancel' },
                        { text: 'Tiếp tục', onPress: () => submitRequisition() },
                    ]
                );
                return;
            }
        }

        submitRequisition();
    };

    const submitRequisition = async () => {
        try {
            // Parse date (simplified - in production use a date picker)
            const parsedDate = new Date(expectedDate);
            if (isNaN(parsedDate.getTime())) {
                Alert.alert('Lỗi', 'Ngày dự kiến không hợp lệ. Định dạng: YYYY-MM-DD');
                return;
            }

            await createRequisition({
                type,
                purpose: purpose.trim(),
                expectedDate: parsedDate,
                warehouse: 'Warehouse Central',
                items,
                notes: notes.trim() || undefined,
                createdBy: 'mgr-001',
                createdByName: 'Nguyen Van A',
            });

            Alert.alert('Thành công', 'Phiếu đề xuất đã được tạo', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tạo phiếu đề xuất');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerBackButton}
                    onPress={() => router.back()}
                >
                    <Feather name="x" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Tạo đề xuất mới</Text>
                </View>
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? 'Đang tạo...' : 'Tạo'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Type Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Loại đề xuất *</Text>
                    <View style={styles.typeCards}>
                        <TouchableOpacity
                            style={[styles.typeCard, type === 'inbound' && styles.typeCardActive]}
                            onPress={() => setType('inbound')}
                        >
                            <View style={[styles.typeCardIcon, type === 'inbound' && styles.typeCardIconActive]}>
                                <Feather
                                    name="arrow-down-circle"
                                    size={28}
                                    color={type === 'inbound' ? '#fff' : '#3B82F6'}
                                />
                            </View>
                            <Text style={[styles.typeCardTitle, type === 'inbound' && styles.typeCardTitleActive]}>
                                Nhập kho
                            </Text>
                            <Text style={styles.typeCardDescription}>
                                Đề xuất nhập hàng từ nhà cung cấp
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.typeCard, type === 'outbound' && styles.typeCardActive]}
                            onPress={() => setType('outbound')}
                        >
                            <View style={[styles.typeCardIcon, type === 'outbound' && styles.typeCardIconActive]}>
                                <Feather
                                    name="arrow-up-circle"
                                    size={28}
                                    color={type === 'outbound' ? '#fff' : '#8B5CF6'}
                                />
                            </View>
                            <Text style={[styles.typeCardTitle, type === 'outbound' && styles.typeCardTitleActive]}>
                                Xuất kho
                            </Text>
                            <Text style={styles.typeCardDescription}>
                                Đề xuất xuất hàng cho khách hàng
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Purpose */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mục đích *</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Nhập mục đích của phiếu đề xuất..."
                        value={purpose}
                        onChangeText={setPurpose}
                        multiline
                        numberOfLines={3}
                        placeholderTextColor={COLORS.textMuted}
                    />
                </View>

                {/* Expected Date */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ngày dự kiến *</Text>
                    <View style={styles.inputContainer}>
                        <Feather name="calendar" size={18} color={COLORS.textMuted} />
                        <TextInput
                            style={styles.input}
                            placeholder="YYYY-MM-DD (VD: 2026-02-15)"
                            value={expectedDate}
                            onChangeText={setExpectedDate}
                            placeholderTextColor={COLORS.textMuted}
                        />
                    </View>
                    <Text style={styles.hint}>Định dạng: YYYY-MM-DD</Text>
                </View>

                {/* Items */}
                <View style={styles.section}>
                    <View style={styles.itemsHeader}>
                        <Text style={styles.sectionTitle}>Sản phẩm *</Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setShowProductPicker(true)}
                        >
                            <Feather name="plus" size={16} color="#fff" />
                            <Text style={styles.addButtonText}>Thêm SP</Text>
                        </TouchableOpacity>
                    </View>

                    {items.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Feather name="package" size={48} color={COLORS.border} />
                            <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
                            <Text style={styles.emptyHint}>Nhấn "Thêm SP" để thêm sản phẩm</Text>
                        </Card>
                    ) : (
                        <Card style={styles.itemsCard}>
                            {items.map((item, index) => (
                                <View key={item.id}>
                                    <View style={styles.itemRow}>
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemName}>{item.productName}</Text>
                                            <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                                        </View>
                                        <View style={styles.itemActions}>
                                            <View style={styles.quantityInput}>
                                                <TextInput
                                                    style={styles.quantityInputField}
                                                    value={String(item.quantity)}
                                                    onChangeText={(text) => handleUpdateQuantity(item.id, text)}
                                                    keyboardType="number-pad"
                                                />
                                                <Text style={styles.quantityUnit}>{item.unit}</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.removeButton}
                                                onPress={() => handleRemoveItem(item.id)}
                                            >
                                                <Feather name="x" size={18} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    {index < items.length - 1 && <View style={styles.itemDivider} />}
                                </View>
                            ))}
                        </Card>
                    )}
                </View>

                {/* Notes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ghi chú</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Nhập ghi chú bổ sung (tùy chọn)..."
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={3}
                        placeholderTextColor={COLORS.textMuted}
                    />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Product Picker Modal */}
            <Modal
                visible={showProductPicker}
                animationType="slide"
                onRequestClose={() => setShowProductPicker(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chọn sản phẩm</Text>
                        <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                            <Feather name="x" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalSearch}>
                        <Feather name="search" size={18} color={COLORS.textMuted} />
                        <TextInput
                            style={styles.modalSearchInput}
                            placeholder="Tìm kiếm sản phẩm, SKU..."
                            value={productSearch}
                            onChangeText={setProductSearch}
                            placeholderTextColor={COLORS.textMuted}
                        />
                    </View>

                    <FlatList
                        data={filteredProducts}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.productItem}
                                onPress={() => handleAddProduct(item)}
                            >
                                <View style={styles.productIcon}>
                                    <Feather name="package" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName}>{item.name}</Text>
                                    <Text style={styles.productSku}>SKU: {item.sku}</Text>
                                    <Text style={styles.productStock}>
                                        Tồn kho: {item.stockLevel} {item.unit}
                                    </Text>
                                </View>
                                <Feather name="plus-circle" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.productList}
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerBackButton: {
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },
    typeCards: {
        flexDirection: 'row',
        gap: 12,
    },
    typeCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    typeCardActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '05',
    },
    typeCardIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3B82F615',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeCardIconActive: {
        backgroundColor: COLORS.primary,
    },
    typeCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    typeCardTitleActive: {
        color: COLORS.primary,
    },
    typeCardDescription: {
        fontSize: 11,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    textArea: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: COLORS.text,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 14,
        color: COLORS.text,
    },
    hint: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 6,
        fontStyle: 'italic',
    },
    itemsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    addButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    emptyCard: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginTop: 12,
    },
    emptyHint: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    itemsCard: {
        padding: 16,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    itemSku: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quantityInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
        gap: 6,
    },
    quantityInputField: {
        width: 50,
        paddingVertical: 8,
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
    },
    quantityUnit: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    removeButton: {
        padding: 4,
    },
    itemDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 8,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
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
        flexDirection: 'row',
        alignItems: 'center',
        margin: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        gap: 10,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
    },
    productList: {
        padding: 20,
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
    },
    productIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    productSku: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    productStock: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
});
