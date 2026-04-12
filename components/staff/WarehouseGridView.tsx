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

import { COLORS } from '@/constants/color';

interface WarehouseGridViewProps {
  structure: WarehouseStructure;
  highlightedShelf?: string;
  recommendedShelves?: string[];
  highlightedBins?: (string | number)[];
  onShelfPress?: (shelf: Shelf, zone: WarehouseZone) => void;
}

export const WarehouseGridView: React.FC<WarehouseGridViewProps> = ({
  structure,
  highlightedShelf,
  recommendedShelves,
  highlightedBins,
  onShelfPress,
}) => {
  const [selectedZone, setSelectedZone] = useState<string | null>(
    (structure.zones ?? [])[0]?.id || null
  );

  const currentZone = (structure.zones ?? []).find((z) => z.id === selectedZone);

  const renderBinGrid = (shelf: Shelf, zone: WarehouseZone) => {
    const levels = shelf.levels ?? [];
    const isRecommendedShelf = (recommendedShelves ?? []).includes(shelf.id);
    const isHighlighted = highlightedShelf === shelf.id;
    const totalBins = levels.reduce((acc, level) => acc + (level.bins?.length ?? 0), 0);

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onShelfPress?.(shelf, zone)}
        style={[
          styles.rackCard,
          isRecommendedShelf && styles.rackCardRecommended,
          isHighlighted && !isRecommendedShelf && styles.rackCardHighlighted,
        ]}
      >
        {/* Rack Header */}
        <View style={styles.rackHeader}>
          <View style={styles.rackHeaderLeft}>
            <View style={[
              styles.rackIconWrap,
              isRecommendedShelf && { backgroundColor: COLORS.success + '18' },
              isHighlighted && !isRecommendedShelf && { backgroundColor: COLORS.primaryLight },
            ]}>
              <Feather
                name="layers"
                size={16}
                color={isRecommendedShelf ? COLORS.success : isHighlighted ? COLORS.primary : COLORS.slate500}
              />
            </View>
            <View>
              <Text style={[
                styles.rackTitle,
                isRecommendedShelf && { color: COLORS.successText },
                isHighlighted && !isRecommendedShelf && { color: COLORS.primary },
              ]}>
                {shelf.code}
              </Text>
              <Text style={styles.rackSubtitle}>
                {levels.length} tầng · {totalBins} ô
              </Text>
            </View>
          </View>

          <View style={styles.rackHeaderRight}>
            {isRecommendedShelf && (
              <View style={styles.recBadge}>
                <Feather name="star" size={10} color={COLORS.success} />
                <Text style={styles.recBadgeText}>Gợi ý</Text>
              </View>
            )}
            <View style={[
              styles.infoBtn,
              isRecommendedShelf && { backgroundColor: COLORS.success + '18' },
              isHighlighted && !isRecommendedShelf && { backgroundColor: COLORS.primaryLight },
            ]}>
              <Feather
                name="chevron-right"
                size={16}
                color={isRecommendedShelf ? COLORS.success : isHighlighted ? COLORS.primary : COLORS.slate400}
              />
            </View>
          </View>
        </View>

        {levels.length === 0 ? (
          <View style={styles.emptyRack}>
            <Feather name="inbox" size={20} color={COLORS.slate300} />
            <Text style={styles.emptyRackText}>Chưa có ô hàng</Text>
          </View>
        ) : (
          <View style={styles.levelsContainer}>
            {levels.map((level, levelIndex) => (
              <View key={level.id} style={styles.levelRow}>
                {/* Level tag */}
                <View style={[
                  styles.levelTag,
                  isRecommendedShelf && { backgroundColor: COLORS.success + '18', borderColor: COLORS.success + '30' },
                ]}>
                  <Text style={[
                    styles.levelTagText,
                    isRecommendedShelf && { color: COLORS.success },
                  ]}>
                    {level.code}
                  </Text>
                </View>

                {/* Bins */}
                <View style={styles.binsRow}>
                  {(level.bins ?? []).map((bin) => {
                    const isRecommendedBin = (highlightedBins ?? []).some(
                      (code) => String(code) === bin.code || String(code) === bin.id
                    );
                    const hasAnyRecommendations =
                      (recommendedShelves?.length ?? 0) > 0 || (highlightedBins?.length ?? 0) > 0;
                    const isSuggested = isRecommendedShelf || isRecommendedBin;
                    const isDimmed = hasAnyRecommendations && !isSuggested;

                    return (
                      <View
                        key={bin.id}
                        style={[
                          styles.binSlot,
                          isSuggested && styles.binSlotSuggested,
                          isDimmed && styles.binSlotDimmed,
                          isHighlighted && !isSuggested && !isDimmed && styles.binSlotHighlighted,
                        ]}
                      >
                        <Text style={[
                          styles.binCode,
                          isSuggested && styles.binCodeSuggested,
                          isDimmed && styles.binCodeDimmed,
                          isHighlighted && !isSuggested && !isDimmed && styles.binCodeHighlighted,
                        ]}>
                          {bin.code}
                        </Text>
                        {isRecommendedBin && <View style={styles.binDot} />}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
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
            {(structure.zones ?? []).map((zone) => (
              <TouchableOpacity
                key={zone.id}
                style={[styles.zoneTab, selectedZone === zone.id && styles.zoneTabActive]}
                onPress={() => setSelectedZone(zone.id)}
                activeOpacity={0.8}
              >
                {selectedZone === zone.id && (
                  <View style={styles.zoneTabDot} />
                )}
                <Text style={[styles.zoneTabText, selectedZone === zone.id && styles.zoneTabTextActive]}>
                  {zone.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Feather name="package" size={13} color={COLORS.slate400} />
          <Text style={styles.statText}>
            {currentZone?.shelves?.reduce((acc, s) => acc + (s.levels?.length ?? 0), 0) || 0} tầng
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Feather name="grid" size={13} color={COLORS.slate400} />
          <Text style={styles.statText}>
            {currentZone?.shelves?.reduce(
              (acc, s) => acc + (s.levels ?? []).reduce((sum, l) => sum + (l.bins?.length ?? 0), 0),
              0
            ) || 0} ô hàng
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Feather name="layers" size={13} color={COLORS.slate400} />
          <Text style={styles.statText}>
            {currentZone?.shelves?.length || 0} kệ
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

        {(!currentZone?.shelves || currentZone.shelves.length === 0) && (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Feather name="inbox" size={32} color={COLORS.slate300} />
            </View>
            <Text style={styles.emptyText}>Chưa có kệ nào trong khu vực này</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Zone tabs ─────────────────────────────────────────────────────────────
  zoneTabs: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  zoneTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  zoneTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.slate100,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  zoneTabActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary + '40',
  },
  zoneTabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  zoneTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slate500,
    letterSpacing: 0.2,
  },
  zoneTabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // ── Stats bar ─────────────────────────────────────────────────────────────
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 0,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    justifyContent: 'center',
  },
  statText: {
    fontSize: 12,
    color: COLORS.slate500,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.borderLight,
  },

  // ── Rack card ─────────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  gridContent: {
    padding: 14,
    gap: 10,
    paddingBottom: 32,
  },
  rackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    shadowColor: COLORS.slate900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  rackCardRecommended: {
    borderColor: COLORS.success + '60',
    backgroundColor: '#FBFFFE',
    shadowColor: COLORS.success,
    shadowOpacity: 0.08,
    elevation: 3,
  },
  rackCardHighlighted: {
    borderColor: COLORS.primary + '50',
    backgroundColor: '#FAFFFE',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
  },

  // ── Rack header ───────────────────────────────────────────────────────────
  rackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rackHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rackHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rackIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rackTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.slate800,
    letterSpacing: -0.3,
  },
  rackSubtitle: {
    fontSize: 11,
    color: COLORS.slate400,
    fontWeight: '500',
    marginTop: 1,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.success + '18',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  recBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 0.3,
  },
  infoBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Levels & bins ─────────────────────────────────────────────────────────
  levelsContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  levelTag: {
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.slate100,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  levelTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate500,
    letterSpacing: 0.3,
  },
  binsRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  binSlot: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
    backgroundColor: COLORS.slate50,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  binSlotSuggested: {
    borderColor: COLORS.success + '70',
    backgroundColor: COLORS.success + '10',
  },
  binSlotHighlighted: {
    borderColor: COLORS.primary + '60',
    backgroundColor: COLORS.primaryLight,
  },
  binSlotDimmed: {
    opacity: 0.3,
  },
  binCode: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate600,
    letterSpacing: 0.2,
  },
  binCodeSuggested: {
    color: COLORS.successText,
    fontWeight: '700',
  },
  binCodeHighlighted: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  binCodeDimmed: {
    color: COLORS.slate300,
  },
  binDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.success,
  },

  // ── Empty states ──────────────────────────────────────────────────────────
  emptyRack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: COLORS.slate50,
  },
  emptyRackText: {
    fontSize: 13,
    color: COLORS.slate400,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.slate400,
    fontWeight: '500',
  },
});
