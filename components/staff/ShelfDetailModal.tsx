import { COLORS } from '@/constants/color';
import { Shelf, WarehouseZone } from '@/types/warehouse';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export interface ShelfActionItem {
  id: number; // ID of the item in the ticket
  productId: number;
  name: string;
  sku?: string;
  targetQuantity: number;
  currentQuantity: number;
  binCode: string;
  binId: number | string;
  isRecommended?: boolean;
  pendingQuantity?: number; // User can specify how many to move now
}

interface ShelfDetailModalProps {
  visible: boolean;
  shelf: Shelf | null;
  zone: WarehouseZone | null;
  onClose: () => void;
  onFindPath?: (shelf: Shelf) => void;
  recommendedItems?: ShelfActionItem[];
  onConfirmOperation?: (items: ShelfActionItem[]) => void;
  onUpdateShelf?: (shelf: Shelf) => void;
  operationType?: 'inbound' | 'outbound';
  isProcessing?: boolean;
}

export const ShelfDetailModal: React.FC<ShelfDetailModalProps> = ({
  visible,
  shelf,
  zone,
  onClose,
  onFindPath,
  recommendedItems = [],
  onConfirmOperation,
  onUpdateShelf,
  operationType = 'inbound',
  isProcessing = false,
}) => {
  if (!shelf || !zone) return null;

  const hasItems = recommendedItems.length > 0;
  const recommendedOnly = recommendedItems.filter(item => item.isRecommended);
  const manualOnly = recommendedItems.filter(item => !item.isRecommended);

  const renderItemSection = (items: ShelfActionItem[], title: string, isAuto: boolean) => {
    if (items.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isAuto ? (operationType === 'inbound' ? COLORS.successText : COLORS.primary) : COLORS.slate600 }]}>
            {title}
          </Text>
          <View style={[styles.badge, { backgroundColor: isAuto ? (operationType === 'inbound' ? COLORS.successLight : COLORS.primaryLight) : COLORS.slate100 }]}>
            <Text style={[styles.badgeText, { color: isAuto ? (operationType === 'inbound' ? COLORS.success : COLORS.primary) : COLORS.slate500 }]}>
              {items.length} mặt hàng
            </Text>
          </View>
        </View>
        
        {items.map((item, idx) => (
          <View key={`${item.id}-${idx}`} style={[styles.itemRow, !isAuto && styles.manualItemRow]}>
            <View style={styles.itemInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                {item.isRecommended && (
                  <View style={styles.recBadge}>
                    <Text style={styles.recBadgeText}>Gợi ý</Text>
                  </View>
                )}
              </View>
              <View style={styles.itemMeta}>
                <Text style={styles.itemSku}>{item.sku || 'No SKU'}</Text>
                <View style={styles.dot} />
                <Text style={styles.itemBin}>Vị trí: <Text style={{ fontWeight: '700' }}>{item.binCode}</Text></Text>
              </View>
            </View>
            <View style={styles.itemQty}>
              <Text style={styles.qtyLabel}>{operationType === 'inbound' ? 'Cần xếp' : 'Cần nhặt'}</Text>
              <Text style={styles.qtyValue}>{item.targetQuantity}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={[styles.header, hasItems && { borderBottomColor: operationType === 'inbound' ? COLORS.success + '30' : COLORS.primary + '30' }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: hasItems ? (operationType === 'inbound' ? COLORS.successLight : COLORS.primaryLight) : '#F1F5F9' }]}>
                <Feather 
                   name={hasItems ? (operationType === 'inbound' ? "arrow-down-circle" : "arrow-up-circle") : "package"} 
                  size={24} 
                  color={hasItems ? (operationType === 'inbound' ? COLORS.success : COLORS.primary) : COLORS.slate500} 
                />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.shelfCode}>{shelf.code}</Text>
                <Text style={styles.zoneCode}>Khu vực: {zone.code}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity 
                style={styles.headerActionBtn}
                onPress={() => onUpdateShelf?.(shelf)}
                activeOpacity={0.7}
              >
                <Feather name="edit-2" size={18} color={COLORS.slate500} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Recommended Items */}
            {renderItemSection(recommendedOnly, "Vị trí được gợi ý", true)}
            
            {/* Manual Placement Items */}
            {renderItemSection(manualOnly, "Vị trí trống (Xếp hàng thủ công)", false)}

            {/* Thông tin kệ */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Tọa độ</Text>
                  <Text style={styles.infoValue}>{shelf.x.toFixed(1)}, {shelf.y.toFixed(1)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Kích thước</Text>
                  <Text style={styles.infoValue}>{shelf.width}x{shelf.height}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Sức chứa</Text>
                  <Text style={styles.infoValue}>{shelf.levels?.reduce((acc, l) => acc + (l.bins?.length || 0), 0)} Bins</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {hasItems && onConfirmOperation && (
              <TouchableOpacity
                style={[
                  styles.operationButton, 
                  { backgroundColor: operationType === 'inbound' ? COLORS.success : COLORS.primary },
                  isProcessing && { opacity: 0.7 }
                ]}
                onPress={() => onConfirmOperation(recommendedItems)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="check-circle" size={18} color="#fff" />
                    <Text style={styles.operationButtonText}>
                      Xác nhận {operationType === 'inbound' ? 'đã xếp' : 'đã nhặt'} {recommendedItems.length} mặt hàng
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: hasItems ? 12 : 0 }}>
              {onFindPath && (
                <TouchableOpacity
                  style={[styles.secondaryButton, { flex: 1.5 }]}
                  onPress={() => {
                    if (shelf) {
                      onFindPath(shelf);
                      onClose();
                    }
                  }}
                >
                  <Feather name="navigation" size={18} color={COLORS.slate600} />
                  <Text style={styles.secondaryButtonText}>Tìm đường</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1 }]}
                onPress={() => onUpdateShelf?.(shelf)}
              >
                <Feather name="settings" size={18} color={COLORS.slate600} />
                <Text style={styles.secondaryButtonText}>Cập nhật</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelfCode: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.slate800,
    letterSpacing: -0.5,
  },
  zoneCode: {
    fontSize: 13,
    color: COLORS.slate500,
    fontWeight: '600',
    marginTop: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.slate800,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.slate500,
    marginBottom: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  manualItemRow: {
    opacity: 0.85,
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
  },
  recBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recBadgeText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '800',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemSku: {
    fontSize: 12,
    color: COLORS.slate500,
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.slate300,
    marginHorizontal: 8,
  },
  itemBin: {
    fontSize: 12,
    color: COLORS.slate600,
  },
  itemQty: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  qtyLabel: {
    fontSize: 11,
    color: COLORS.slate500,
    marginBottom: 2,
    fontWeight: '600',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.slate800,
  },
  actions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  operationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  operationButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    height: 50,
    borderRadius: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate600,
  },
});
