import { Card, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useCreateOutboundRequisition, useCreateRequisition } from '@/hooks';
import { useProducts } from '@/hooks/product.hooks';
import { useSuppliers } from '@/hooks/suppliers.hooks';
import { api } from '@/services/axios.instance';
import { useAuthStore } from '@/stores/auth.store';
import type { RequisitionItem, RequisitionType } from '@/types/requisition';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
    const { mutateAsync: createRequisition, isPending: loadingInbound } = useCreateRequisition();
    const { mutateAsync: createOutboundRequisition, isPending: loadingOutbound } = useCreateOutboundRequisition();
    const loading = loadingInbound || loadingOutbound;
    const { data: products = [], isLoading: loadingProducts } = useProducts();
    const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers();
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const companyId = user?.companyId;

    const [type, setType] = useState<RequisitionType>('inbound');
    const [warehouseId, setWarehouseId] = useState<number | null>(null);
    const [supplierId, setSupplierId] = useState<number | null>(null);
    const [destination, setDestination] = useState<string>('');
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loadingWarehouses, setLoadingWarehouses] = useState(false);
    const [items, setItems] = useState<RequisitionItem[]>([]);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [showWarehousePicker, setShowWarehousePicker] = useState(false);
    const [showSupplierPicker, setShowSupplierPicker] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    // Load warehouses - chỉ chạy 1 lần khi component mount
    useEffect(() => {
        let mounted = true;

        const loadWarehouses = async () => {
            // Ưu tiên: Nếu user đã có warehouse assignment, auto-select luôn
            if (user?.warehouseId && !warehouseId) {
                console.log('Auto-selecting warehouse from user profile:', user.warehouseId);
                setWarehouseId(user.warehouseId);

                // Tạo mock warehouse entry để hiển thị tên
                if (user.warehouseName) {
                    setWarehouses([{
                        warehouseId: user.warehouseId,
                        id: user.warehouseId,
                        warehouseName: user.warehouseName,
                        name: user.warehouseName
                    }]);
                }
                return; // Không cần load warehouse list nữa
            }

            if (!companyId) {
                console.log('No companyId available');
                return;
            }

            if (!token) {
                console.log('No token available, please login again');
                Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                return;
            }

            setLoadingWarehouses(true);
            console.log('Loading warehouses for companyId:', companyId);

            try {
                const res = await api.get(`/api/company-warehouses/${companyId}/assignments`);
                if (!mounted) return;

                console.log('Warehouses loaded successfully:', res.data?.length || 0);
                setWarehouses(res.data || []);

                // Auto-select first warehouse if available (chỉ khi chưa có từ user profile)
                if (res.data && res.data.length > 0 && !warehouseId) {
                    setWarehouseId(res.data[0].warehouseId || res.data[0].id);
                }
            } catch (error: any) {
                if (!mounted) return;

                console.warn('Warehouse endpoint not available:', error.response?.status);

                // For 403/404, just allow manual warehouse ID entry
                if (error.response?.status === 403 || error.response?.status === 404) {
                    console.log('Warehouses endpoint not available - user can enter warehouse ID manually');
                    setWarehouses([]);
                } else if (error.response?.status === 401) {
                    Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                } else {
                    console.error('Error loading warehouses:', error.message);
                }
            } finally {
                if (mounted) {
                    setLoadingWarehouses(false);
                }
            }
        };

        loadWarehouses();

        return () => {
            mounted = false;
        };
    }, []); // Chỉ chạy 1 lần khi mount

    // Auto-select first supplier
    useEffect(() => {
        if (suppliers.length > 0 && !supplierId) {
            setSupplierId(suppliers[0].supplierId);
        }
    }, [suppliers]);

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
        if (!companyId) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin công ty. Vui lòng đăng nhập lại.');
            return;
        }

        if (!warehouseId) {
            Alert.alert('Lỗi', 'Vui lòng chọn kho');
            return;
        }

        // Validate based on type
        if (type === 'inbound') {
            if (!supplierId) {
                Alert.alert('Lỗi', 'Vui lòng chọn nhà cung cấp');
                return;
            }
        } else if (type === 'outbound') {
            if (!destination || destination.trim() === '') {
                Alert.alert('Lỗi', 'Vui lòng nhập địa điểm xuất kho');
                return;
            }
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
        if (!user) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
            return;
        }

        try {
            if (type === 'inbound') {
                await createRequisition({
                    warehouseId: warehouseId!,
                    supplierId: supplierId!,
                    items: items.map(i => ({
                        productId: i.id,
                        expectedQuantity: i.quantity
                    })),
                });
                Alert.alert('Thành công', 'Phiếu đề nghị nhập kho đã được tạo', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                await createOutboundRequisition({
                    warehouseId: warehouseId!,
                    destination: destination.trim(),
                    items: items.map(i => ({
                        productId: i.id,
                        quantity: i.quantity
                    })),
                });
                Alert.alert('Thành công', 'Phiếu đề nghị xuất kho đã được tạo', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            }
        } catch (error) {
            console.error('Create requisition error:', error);
            Alert.alert('Lỗi', 'Không thể tạo phiếu đề nghị. Vui lòng kiểm tra lại thông tin.');
        }
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Tạo đề nghị mới"
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
                    <Text style={styles.sectionTitle}>Loại đề nghị *</Text>
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
                                Đề nghị nhập hàng từ nhà cung cấp
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.typeCard,
                                type === 'outbound' && styles.typeCardActive
                            ]}
                            onPress={() => setType('outbound')}
                        >
                            <View style={[styles.typeCardIcon, type === 'outbound' && styles.typeCardIconActive]}>
                                <Feather
                                    name="arrow-up-circle"
                                    size={28}
                                    color={type === 'outbound' ? '#fff' : '#10B981'}
                                />
                            </View>
                            <Text style={[styles.typeCardTitle, type === 'outbound' && styles.typeCardTitleActive]}>
                                Xuất kho
                            </Text>
                            <Text style={styles.typeCardDescription}>
                                Đề nghị xuất hàng ra khỏi kho
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Warehouse & Supplier */}
                <View style={styles.row}>
                    <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.sectionTitle}>Kho *</Text>
                        <TouchableOpacity
                            style={styles.selectField}
                            onPress={() => {
                                if (warehouses.length === 0 && !loadingWarehouses) {
                                    Alert.alert(
                                        'Không có kho',
                                        'Không tìm thấy kho nào. Bạn có muốn nhập ID kho thủ công không?',
                                        [
                                            { text: 'Hủy', style: 'cancel' },
                                            {
                                                text: 'Nhập thủ công',
                                                onPress: () => {
                                                    Alert.prompt(
                                                        'Nhập ID Kho',
                                                        'Vui lòng nhập ID kho (số nguyên)',
                                                        [
                                                            { text: 'Hủy', style: 'cancel' },
                                                            {
                                                                text: 'OK',
                                                                onPress: (value?: string) => {
                                                                    const id = parseInt(value || '0');
                                                                    if (id > 0) {
                                                                        setWarehouseId(id);
                                                                    } else {
                                                                        Alert.alert('Lỗi', 'ID kho không hợp lệ');
                                                                    }
                                                                }
                                                            }
                                                        ],
                                                        'plain-text',
                                                        '',
                                                        'number-pad'
                                                    );
                                                }
                                            }
                                        ]
                                    );
                                } else {
                                    setShowWarehousePicker(true);
                                }
                            }}
                            disabled={loadingWarehouses}
                        >
                            <Text style={[styles.selectFieldText, !warehouseId && styles.placeholder]}>
                                {loadingWarehouses
                                    ? 'Đang tải...'
                                    : warehouseId
                                        ? warehouses.find(w => (w.warehouseId || w.id) === warehouseId)?.warehouseName || warehouses.find(w => (w.warehouseId || w.id) === warehouseId)?.name || `Kho #${warehouseId}`
                                        : 'Chọn kho'
                                }
                            </Text>
                            <Feather name="chevron-down" size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>
                        {warehouses.length === 0 && !loadingWarehouses && (
                            <Text style={styles.warningText}>⚠️ Không tìm thấy kho. Nhấn để nhập thủ công.</Text>
                        )}
                    </View>
                    {type === 'inbound' ? (
                        <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.sectionTitle}>Nhà CC *</Text>
                            <TouchableOpacity
                                style={styles.selectField}
                                onPress={() => setShowSupplierPicker(true)}
                                disabled={loadingSuppliers}
                            >
                                <Text style={[styles.selectFieldText, !supplierId && styles.placeholder]}>
                                    {loadingSuppliers
                                        ? 'Đang tải...'
                                        : supplierId
                                            ? suppliers.find(s => s.supplierId === supplierId)?.supplierName || `NCC #${supplierId}`
                                            : 'Chọn NCC'
                                    }
                                </Text>
                                <Feather name="chevron-down" size={20} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.sectionTitle}>Đ/điểm *</Text>
                            <TextInput
                                style={styles.inputField}
                                placeholder="Nhập địa điểm xuất kho"
                                placeholderTextColor={COLORS.textMuted}
                                value={destination}
                                onChangeText={setDestination}
                            />
                        </View>
                    )}
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
                            <Text style={styles.emptyHint}>Nhấn &quot;Thêm SP&quot; để lấy hàng từ kho</Text>
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

            {/* Warehouse Picker Modal */}
            <Modal
                visible={showWarehousePicker}
                animationType="slide"
                onRequestClose={() => setShowWarehousePicker(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chọn kho</Text>
                        <TouchableOpacity onPress={() => setShowWarehousePicker(false)}>
                            <Feather name="x" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    {loadingWarehouses ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text>Đang tải...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={warehouses}
                            keyExtractor={item => String(item.warehouseId || item.id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.listItem,
                                        (item.warehouseId || item.id) === warehouseId && styles.listItemSelected
                                    ]}
                                    onPress={() => {
                                        setWarehouseId(item.warehouseId || item.id);
                                        setShowWarehousePicker(false);
                                    }}
                                >
                                    <View style={styles.listItemIcon}>
                                        <Feather name="home" size={20} color={COLORS.primary} />
                                    </View>
                                    <View style={styles.listItemInfo}>
                                        <Text style={styles.listItemName}>
                                            {item.warehouseName || item.name || `Kho #${item.warehouseId || item.id}`}
                                        </Text>
                                        {item.address && (
                                            <Text style={styles.listItemMeta}>{item.address}</Text>
                                        )}
                                    </View>
                                    {(item.warehouseId || item.id) === warehouseId && (
                                        <Feather name="check" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.listContainer}
                        />
                    )}
                </View>
            </Modal>

            {/* Supplier Picker Modal */}
            <Modal
                visible={showSupplierPicker}
                animationType="slide"
                onRequestClose={() => setShowSupplierPicker(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chọn nhà cung cấp</Text>
                        <TouchableOpacity onPress={() => setShowSupplierPicker(false)}>
                            <Feather name="x" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    {loadingSuppliers ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text>Đang tải...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={suppliers}
                            keyExtractor={item => String(item.supplierId)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.listItem,
                                        item.supplierId === supplierId && styles.listItemSelected
                                    ]}
                                    onPress={() => {
                                        setSupplierId(item.supplierId);
                                        setShowSupplierPicker(false);
                                    }}
                                >
                                    <View style={styles.listItemIcon}>
                                        <Feather name="truck" size={20} color={COLORS.primary} />
                                    </View>
                                    <View style={styles.listItemInfo}>
                                        <Text style={styles.listItemName}>{item.supplierName}</Text>
                                        {item.email && (
                                            <Text style={styles.listItemMeta}>{item.email}</Text>
                                        )}
                                    </View>
                                    {item.supplierId === supplierId && (
                                        <Feather name="check" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.listContainer}
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
    selectField: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectFieldText: {
        fontSize: 14,
        color: COLORS.text,
        flex: 1,
    },
    placeholder: {
        color: COLORS.textMuted,
    },
    warningText: {
        fontSize: 11,
        color: '#F59E0B',
        marginTop: 4,
        fontStyle: 'italic',
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
    listContainer: {
        padding: 20,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
    },
    listItemSelected: {
        backgroundColor: COLORS.primary + '15',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    listItemIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listItemInfo: {
        flex: 1,
    },
    listItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    listItemMeta: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
});

