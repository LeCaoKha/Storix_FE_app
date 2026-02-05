import { Card, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useCreateRequisition } from '@/hooks';
import { useProducts } from '@/hooks/product.hooks';
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
    const { mutateAsync: createRequisition, isPending: loading } = useCreateRequisition();
    const { data: products = [], isLoading: loadingProducts } = useProducts();

    const [type, setType] = useState<RequisitionType>('inbound');
    const [warehouseId, setWarehouseId] = useState('1');
    const [supplierId, setSupplierId] = useState('1');
    const [items, setItems] = useState<RequisitionItem[]>([]);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
    );

    const handleAddProduct = (product: any) => {
        // Check if already added
        if (items.some(item => item.id === product.id)) {
            Alert.alert('Thông báo', 'Sản phẩm đã có trong danh sách');
            return;
        }

        const newItem: RequisitionItem = {
            id: product.id,
            sku: product.sku,
            productName: product.name,
            quantity: 1,
            unit: product.unit || 'Cái',
        };

        setItems([...items, newItem]);
        setShowProductPicker(false);
        setProductSearch('');
    };

    const handleRemoveItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleUpdateQuantity = (id: number, quantity: string) => {
        const numQuantity = parseInt(quantity) || 0;
        setItems(items.map(item =>
            item.id === id ? { ...item, quantity: numQuantity } : item
        ));
    };

    const handleSubmit = async () => {
        if (type === 'outbound') {
            Alert.alert('Thông báo', 'Backend hiện chưa hỗ trợ tạo phiếu xuất kho. Vui lòng liên hệ Admin.');
            return;
        }

        if (!warehouseId) {
            Alert.alert('Lỗi', 'Vui lòng nhập ID kho');
            return;
        }

        if (!supplierId) {
            Alert.alert('Lỗi', 'Vui lòng nhập ID nhà cung cấp');
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

        submitRequisition();
    };

    const submitRequisition = async () => {
        try {
            await createRequisition({
                warehouseId: parseInt(warehouseId),
                supplierId: parseInt(supplierId),
                items: items.map(i => ({
                    productId: i.id,
                    expectedQuantity: i.quantity
                })),
            });

            Alert.alert('Thành công', 'Phiếu đề xuất nhập kho đã được tạo', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error) {
            console.error('Create requisition error:', error);
            Alert.alert('Lỗi', 'Không thể tạo phiếu đề xuất. Vui lòng kiểm tra lại ID kho/NCC.');
        }
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Tạo đề xuất mới"
                rightButton={
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? 'Đang tạo...' : 'Tạo'}
                        </Text>
                    </TouchableOpacity>
                }
            />

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
                            style={[
                                styles.typeCard,
                                type === 'outbound' && styles.typeCardActive,
                                { opacity: 0.5 }
                            ]}
                            onPress={() => {
                                Alert.alert('Thông báo', 'Tính năng xuất kho đang được Backend phát triển.');
                            }}
                        >
                            <View style={[styles.typeCardIcon, type === 'outbound' && styles.typeCardIconActive, { backgroundColor: '#ccc' }]}>
                                <Feather
                                    name="lock"
                                    size={24}
                                    color="#fff"
                                />
                            </View>
                            <Text style={[styles.typeCardTitle, type === 'outbound' && styles.typeCardTitleActive]}>
                                Xuất kho
                            </Text>
                            <Text style={styles.typeCardDescription}>
                                (Đang phát triển backend)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Warehouse & Supplier */}
                <View style={styles.row}>
                    <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.sectionTitle}>ID Kho *</Text>
                        <TextInput
                            style={styles.inputField}
                            value={warehouseId}
                            onChangeText={setWarehouseId}
                            keyboardType="number-pad"
                            placeholder="VD: 1"
                        />
                    </View>
                    <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.sectionTitle}>ID Nhà CC *</Text>
                        <TextInput
                            style={styles.inputField}
                            value={supplierId}
                            onChangeText={setSupplierId}
                            keyboardType="number-pad"
                            placeholder="VD: 1"
                        />
                    </View>
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
                            <Text style={styles.emptyHint}>Nhấn "Thêm SP" để lấy hàng từ kho</Text>
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

                    {loadingProducts ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text>Đang tải sản phẩm...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredProducts}
                            keyExtractor={item => String(item.id)}
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
                                        <Text style={styles.productSku}>SKU: {item.sku || 'N/A'}</Text>
                                        <Text style={styles.productStock}>
                                            Đơn vị: {item.unit || 'Cái'}
                                        </Text>
                                    </View>
                                    <Feather name="plus-circle" size={24} color={COLORS.primary} />
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.productList}
                        />
                    )}
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
    row: {
        flexDirection: 'row',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },
    inputField: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        color: COLORS.text,
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

