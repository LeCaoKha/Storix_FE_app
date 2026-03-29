import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        <View style={styles.emptyIconContainer}>
          <Ionicons name="map" size={32} color={COLORS.textSubtle} />
        </View>
        <Text style={styles.emptyText}>Chưa có sơ đồ kho</Text>
      </View>
    );
  }

  const zoneCount = structure.zones?.length ?? 0;
  const nodeCount = structure.nodes?.length ?? 0;

  // Generate a mock grid visual based on zones
  const renderGrid = () => {
    return (
      <View style={styles.gridContainer}>
        {[...Array(6)].map((_, row) => (
          <View key={row} style={styles.gridRow}>
            {[...Array(10)].map((_, col) => {
              const isActive = (row + col) % 3 === 0; // Simple pattern for visual
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

        <View style={styles.mapIcon}>
          <Ionicons name="map" size={20} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.footer}>
          <Text style={styles.footerText}>Xem sơ đồ chi tiết</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
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
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    opacity: 0.5,
  },
  activeCell: {
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
  overlay: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  statGroup: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate700,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mapIcon: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  footer: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  center: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
