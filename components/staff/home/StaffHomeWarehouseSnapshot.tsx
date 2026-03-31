import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useWarehouseStructure } from '@/hooks/warehouse.hooks';
import { COLORS } from '@/constants/color';

interface StaffHomeWarehouseSnapshotProps {
  warehouseId?: number;
}

export const StaffHomeWarehouseSnapshot: React.FC<StaffHomeWarehouseSnapshotProps> = ({ warehouseId }) => {
  const router = useRouter();
  const { data: structure, isLoading } = useWarehouseStructure(warehouseId);

  const handleOpenMap = () => {
    router.push('/(staff-tabs)/warehouse');
  };

  if (isLoading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (!structure) {
    return (
      <View style={[styles.card, styles.center]}>
        <Text style={styles.emptyText}>Chưa có sơ đồ kho</Text>
      </View>
    );
  }

  const zoneCount = structure.zones?.length ?? 0;
  const nodeCount = structure.nodes?.length ?? 0;

  // Generate a schematic grid visual
  const renderGrid = () => {
    return (
      <View style={styles.gridContainer}>
        {[...Array(6)].map((_, row) => (
          <View key={row} style={styles.gridRow}>
            {[...Array(10)].map((_, col) => {
              const isActive = (row + col) % 3 === 0; 
              return (
                <View 
                  key={col} 
                  style={[
                    styles.gridCell, 
                    isActive && styles.activeCell
                  ]} 
                />
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={handleOpenMap}
      activeOpacity={0.9}
    >
      <View style={styles.snapshot}>
        {renderGrid()}
        
        <View style={styles.overlay}>
          <View style={styles.statGroup}>
            <View style={styles.statItem}>
              <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.statLabel}>{zoneCount} Khu vực</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.statLabel}>{nodeCount} Điểm nút</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
          <Text style={styles.footerText}>Xem sơ đồ chi tiết</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  snapshot: {
    height: 160,
    backgroundColor: '#F8FAFC',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  gridContainer: {
    width: '100%',
    height: '100%',
    gap: 4,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  gridCell: {
    flex: 1,
    backgroundColor: '#CBD5E1', // Cleaner gray
    borderRadius: 2,
    opacity: 0.3,
  },
  activeCell: {
    backgroundColor: COLORS.primary,
    opacity: 0.2, // Subtle schematic look
  },
  overlay: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  statGroup: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155', // COLORS.slate700
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '800', // Bolder "Link" look
  },
  center: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
});
