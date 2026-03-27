import { COLORS } from '@/constants/color';
import { Shelf, WarehouseZone } from '@/types/warehouse';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ShelfDetailModalProps {
  visible: boolean;
  shelf: Shelf | null;
  zone: WarehouseZone | null;
  onClose: () => void;
  onFindPath?: (shelf: Shelf) => void;
}

export const ShelfDetailModal: React.FC<ShelfDetailModalProps> = ({
  visible,
  shelf,
  zone,
  onClose,
  onFindPath,
}) => {
  if (!shelf || !zone) return null;

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
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Feather name="package" size={24} color={COLORS.primary} />
              <View style={styles.headerText}>
                <Text style={styles.shelfCode}>{shelf.code}</Text>
                <Text style={styles.zoneCode}>Khu vực: {zone.code}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Thông tin vị trí */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin vị trí</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Tọa độ X:</Text>
                  <Text style={styles.infoValue}>{shelf.x.toFixed(1)} m</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Tọa độ Y:</Text>
                  <Text style={styles.infoValue}>{shelf.y.toFixed(1)} m</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Rộng:</Text>
                  <Text style={styles.infoValue}>{shelf.width.toFixed(1)} m</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Cao:</Text>
                  <Text style={styles.infoValue}>{shelf.height.toFixed(1)} m</Text>
                </View>
                {shelf.length && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Dài:</Text>
                    <Text style={styles.infoValue}>{shelf.length.toFixed(1)} m</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Access Points */}
            {shelf.accessNodes && shelf.accessNodes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Điểm truy cập</Text>
                {shelf.accessNodes.map((node, index) => (
                  <View key={node.id} style={styles.accessNode}>
                    <Feather name="navigation" size={16} color={COLORS.primary} />
                    <Text style={styles.accessNodeText}>
                      {node.side === 'front' && 'Phía trước'}
                      {node.side === 'back' && 'Phía sau'}
                      {node.side === 'left' && 'Bên trái'}
                      {node.side === 'right' && 'Bên phải'}
                      {' - '}({node.x.toFixed(1)}, {node.y.toFixed(1)})
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Levels và Bins */}
            {shelf.levels && shelf.levels.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cấu trúc tầng</Text>
                {shelf.levels.map((level) => (
                  <View key={level.id} style={styles.levelCard}>
                    <View style={styles.levelHeader}>
                      <Feather name="layers" size={18} color={COLORS.primary} />
                      <Text style={styles.levelCode}>{level.code}</Text>
                      <Text style={styles.binCount}>
                        {level.bins?.length || 0} ngăn
                      </Text>
                    </View>
                    {level.bins && level.bins.length > 0 && (
                      <View style={styles.binList}>
                        {level.bins.map((bin) => (
                          <View key={bin.id} style={styles.binChip}>
                            <Text style={styles.binChipText}>{bin.code}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          {onFindPath && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.findPathButton}
                onPress={() => {
                  if (shelf) {
                    onFindPath(shelf);
                    onClose();
                  }
                }}
              >
                <Feather name="navigation" size={18} color="#fff" />
                <Text style={styles.findPathButtonText}>Tìm đường đi đến kệ này</Text>
              </TouchableOpacity>
            </View>
          )}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
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
  shelfCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  zoneCode: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  accessNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    marginBottom: 8,
  },
  accessNodeText: {
    fontSize: 14,
    color: '#333',
  },
  levelCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  levelCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  binCount: {
    fontSize: 12,
    color: '#666',
  },
  binList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  binChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  binChipText: {
    fontSize: 12,
    color: '#333',
  },
  actions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  findPathButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
  },
  findPathButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
