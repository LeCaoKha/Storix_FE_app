import { Shelf, WarehouseStructure, WarehouseZone } from '@/types/warehouse';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface WarehouseGridViewProps {
  structure: WarehouseStructure;
  highlightedShelf?: string;
  onShelfPress?: (shelf: Shelf, zone: WarehouseZone) => void;
}

// Bin status colors - simplified since API doesn't provide inventory status
const BIN_COLORS = {
  default: '#E5E7EB',     // Light gray - default
  highlighted: '#3B82F6', // Blue - when selected
};

export const WarehouseGridView: React.FC<WarehouseGridViewProps> = ({
  structure,
  highlightedShelf,
  onShelfPress,
}) => {
  const [selectedZone, setSelectedZone] = useState<string | null>(
    structure.zones?.[0]?.id || null
  );

  const currentZone = structure.zones?.find((z) => z.id === selectedZone);

  const renderBinGrid = (shelf: Shelf, zone: WarehouseZone) => {
    // Use actual data from API
    const levels = shelf.levels || [];
    
    if (levels.length === 0) {
      return (
        <View style={styles.rackCard}>
          {/* Rack header */}
          <View style={styles.rackHeader}>
            <View style={styles.rackIcon}>
              <Feather name="layers" size={16} color="#475569" />
            </View>
            <Text style={styles.rackTitle}>{shelf.code}</Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => onShelfPress?.(shelf, zone)}
            >
              <Feather name="info" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <View style={styles.emptyRack}>
            <Text style={styles.emptyRackText}>No bins configured</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.rackCard}>
        {/* Rack header */}
        <View style={styles.rackHeader}>
          <View style={styles.rackIcon}>
            <Feather name="layers" size={16} color="#475569" />
          </View>
          <Text style={styles.rackTitle}>{shelf.code}</Text>
          <View style={styles.rackStats}>
            <Text style={styles.rackStatsText}>
              {levels.length}L · {levels.reduce((acc, level) => acc + level.bins.length, 0)}B
            </Text>
          </View>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => onShelfPress?.(shelf, zone)}
          >
            <Feather name="info" size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Bin grid - using actual API data */}
        <View style={styles.binGrid}>
          {levels.map((level, levelIndex) => (
            <View key={level.id} style={styles.levelContainer}>
              {/* Level label */}
              <View style={styles.levelLabel}>
                <Text style={styles.levelLabelText}>{level.code}</Text>
              </View>
              
              {/* Bins in this level */}
              <View style={styles.binRow}>
                {level.bins.map((bin) => {
                  const isHighlighted = highlightedShelf === shelf.id;

                  return (
                    <TouchableOpacity
                      key={bin.id}
                      style={[
                        styles.binSlot,
                        { backgroundColor: BIN_COLORS.default },
                        isHighlighted && styles.binSlotHighlighted,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => onShelfPress?.(shelf, zone)}
                    >
                      <Text style={styles.binCode}>{bin.code}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Zone tabs */}
      {structure.zones && structure.zones.length > 1 && (
        <View style={styles.zoneTabs}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.zoneTabsContent}
          >
            {structure.zones.map((zone) => (
              <TouchableOpacity
                key={zone.id}
                style={[
                  styles.zoneTab,
                  selectedZone === zone.id && styles.zoneTabActive,
                ]}
                onPress={() => setSelectedZone(zone.id)}
              >
                <Text
                  style={[
                    styles.zoneTabText,
                    selectedZone === zone.id && styles.zoneTabTextActive,
                  ]}
                >
                  {zone.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Legend - simplified */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Feather name="package" size={14} color="#64748B" />
          <Text style={styles.legendText}>
            {currentZone?.shelves?.reduce((acc, s) => acc + s.levels.length, 0) || 0} Levels
          </Text>
        </View>
        <View style={styles.legendDivider} />
        <View style={styles.legendItem}>
          <Feather name="grid" size={14} color="#64748B" />
          <Text style={styles.legendText}>
            {currentZone?.shelves?.reduce(
              (acc, s) => acc + s.levels.reduce((sum, l) => sum + l.bins.length, 0),
              0
            ) || 0}{' '}
            Bins
          </Text>
        </View>
      </View>

      {/* Racks grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {currentZone?.shelves?.map((shelf) => (
          <View key={shelf.id}>{renderBinGrid(shelf, currentZone)}</View>
        ))}

        {!currentZone?.shelves || currentZone.shelves.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No racks in this zone</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  zoneTabs: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 12,
  },
  zoneTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  zoneTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  zoneTabActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
  },
  zoneTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  zoneTabTextActive: {
    color: '#FFFFFF',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E1',
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  gridContent: {
    padding: 16,
    gap: 16,
  },
  rackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  rackIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rackTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  rackStats: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  rackStatsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  binGrid: {
    gap: 12,
  },
  levelContainer: {
    gap: 6,
  },
  levelLabel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  levelLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  binRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  binSlot: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    minWidth: 50,
  },
  binSlotHighlighted: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#DBEAFE',
  },
  binCode: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  emptyRack: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyRackText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
    fontWeight: '500',
  },
});
