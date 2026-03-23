import { ScreenHeader } from '@/components';
import { PathInstructionsModal, ShelfDetailModal, WarehouseGridView, WarehouseLayout } from '@/components/staff';
import { COLORS } from '@/constants/color';
import { useWarehouses, useWarehouseStructure } from '@/hooks/warehouse.hooks';
import { PathResult, Shelf, WarehouseZone } from '@/types/warehouse';
import { findNearestNode, findShortestPath } from '@/utils/pathfinding';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth.store';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function WarehouseDiagramScreen() {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>();
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [selectedZone, setSelectedZone] = useState<WarehouseZone | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPath, setCurrentPath] = useState<PathResult | null>(null);
  const [pathModalVisible, setPathModalVisible] = useState(false);
  const [currentLocation] = useState<{ x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const user = useAuthStore(state => state.user);
  const isStaff = user?.roleId === 4;

  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
  const {
    data: structure,
    isLoading: structureLoading,
    error: structureError,
  } = useWarehouseStructure(selectedWarehouseId);

  React.useEffect(() => {
    if (warehouses && warehouses.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  const handleShelfPress = (shelf: Shelf, zone: WarehouseZone) => {
    setSelectedShelf(shelf);
    setSelectedZone(zone);
    setModalVisible(true);
  };

  const handleZonePress = (zone: WarehouseZone) => {
    setSelectedZone(zone);
    setSelectedShelf(null);
  };

  const handleFindPath = (shelf: Shelf) => {
    if (!structure) return;
    const startNode = currentLocation
      ? findNearestNode(structure.nodes, currentLocation.x, currentLocation.y)
      : structure.nodes?.[0];

    if (!startNode) return;

    const targetAccessNode = shelf.accessNodes?.[0];
    if (!targetAccessNode) return;

    const endNode = findNearestNode(
      structure.nodes,
      targetAccessNode.x,
      targetAccessNode.y
    );

    if (!endNode) return;

    const path = findShortestPath(structure.nodes, structure.edges, startNode.id, endNode.id);

    if (path) {
      setCurrentPath(path);
      setPathModalVisible(true);
    }
  };

  if (warehousesLoading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Sơ đồ kho" showBackButton={true} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách kho...</Text>
        </View>
      </View>
    );
  }

  if (!warehouses || warehouses.length === 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Sơ đồ kho" showBackButton={true} />
        <View style={styles.centered}>
          <Feather name="inbox" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Chưa có kho nào</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Sơ đồ kho" 
        subtitle={isStaff ? "Xem sơ đồ và tìm đường đi" : "Xem sơ đồ và thông tin kệ hàng"} 
        showBackButton={true} 
      />

      {warehouses.length > 1 && (
        <View style={styles.selectorWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.warehouseSelector}
            contentContainerStyle={styles.warehouseSelectorContent}
          >
            {warehouses.map((warehouse) => (
              <TouchableOpacity
                key={warehouse.id}
                style={[
                  styles.warehouseChip,
                  selectedWarehouseId === warehouse.id && styles.warehouseChipActive,
                ]}
                onPress={() => setSelectedWarehouseId(warehouse.id)}
              >
                <Text
                  style={[
                    styles.warehouseChipText,
                    selectedWarehouseId === warehouse.id &&
                      styles.warehouseChipTextActive,
                  ]}
                >
                  {warehouse.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {structureLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải sơ đồ kho...</Text>
        </View>
      ) : structureError ? (
        <View style={styles.centered}>
          <Feather name="alert-circle" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>Không thể tải sơ đồ kho</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setSelectedWarehouseId(undefined)}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : structure ? (
        <>
          <View style={styles.infoBar}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconWrap}>
                <Feather name="grid" size={14} color={COLORS.infoText} />
              </View>
              <Text style={styles.infoText}>
                {structure.zones?.length || 0} khu vực
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <View style={styles.infoIconWrap}>
                <Feather name="package" size={14} color={COLORS.infoText} />
              </View>
              <Text style={styles.infoText}>
                {structure.zones?.reduce(
                  (acc, zone) => acc + (zone.shelves?.length || 0),
                  0
                ) || 0}{' '}
                kệ hàng
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.viewButton, viewMode === 'map' && styles.viewButtonActive]}
                onPress={() => setViewMode('map')}
              >
                <Feather 
                  name="map" 
                  size={16} 
                  color={viewMode === 'map' ? '#FFFFFF' : '#64748B'} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
                onPress={() => setViewMode('grid')}
              >
                <Feather 
                  name="grid" 
                  size={16} 
                  color={viewMode === 'grid' ? '#FFFFFF' : '#64748B'} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {viewMode === 'map' ? (
            <WarehouseLayout
              structure={structure}
              highlightedPath={currentPath?.path}
              onShelfPress={handleShelfPress}
              onZonePress={handleZonePress}
            />
          ) : (
            <WarehouseGridView
              structure={structure}
              highlightedShelf={selectedShelf?.id}
              onShelfPress={handleShelfPress}
            />
          )}
        </>
      ) : (
        <View style={styles.centered}>
          <Feather name="map-pin" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Chưa có sơ đồ kho</Text>
        </View>
      )}

      <ShelfDetailModal
        visible={modalVisible}
        shelf={selectedShelf}
        zone={selectedZone}
        onFindPath={isStaff ? handleFindPath : undefined}
        onClose={() => {
          setModalVisible(false);
          setSelectedShelf(null);
          setSelectedZone(null);
        }}
      />

      <PathInstructionsModal
        visible={pathModalVisible}
        pathResult={currentPath}
        toLocation={selectedShelf?.code || 'Kệ hàng'}
        onClose={() => {
          setPathModalVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectorWrap: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  warehouseSelector: {
    backgroundColor: '#fff',
  },
  warehouseSelectorContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  warehouseChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.slate100,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  warehouseChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  warehouseChipText: {
    fontSize: 13,
    color: COLORS.slate600,
    fontWeight: '600',
  },
  warehouseChipTextActive: {
    color: '#fff',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 10,
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoDivider: {
    width: 1,
    height: 18,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  viewButtonActive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.slate700,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.slate600,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSubtle,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.slate800,
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
