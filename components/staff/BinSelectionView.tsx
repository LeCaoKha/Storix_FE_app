import { COLORS } from '@/constants/color';
import { Bin, Shelf } from '@/types/warehouse';
import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface BinSelectionViewProps {
  shelf: Shelf | null;
  selectedBinId?: string | number;
  recommendedBinCodes?: string[];
  onSelectBin: (bin: Bin) => void;
}

export const BinSelectionView: React.FC<BinSelectionViewProps> = ({
  shelf,
  selectedBinId,
  recommendedBinCodes = [],
  onSelectBin,
}) => {
  const allBins = useMemo(() => {
    if (!shelf) return [];
    return (shelf.levels ?? []).flatMap((level) => level.bins ?? []);
  }, [shelf]);

  const recommendedBinSet = useMemo(
    () => new Set(recommendedBinCodes.map((code) => String(code))),
    [recommendedBinCodes]
  );

  const selectedBin = useMemo(
    () => allBins.find((b) => String(b.id) === String(selectedBinId)),
    [allBins, selectedBinId]
  );

  if (!shelf?.levels || shelf.levels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="package" size={20} color={COLORS.slate300} />
        <Text style={styles.emptyText}>Kệ này không có ô hàng</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Selected bin indicator */}
      <View style={styles.selectedInfoRow}>
        <View style={[
          styles.selectedDot,
          selectedBin
            ? { backgroundColor: COLORS.primary }
            : { backgroundColor: COLORS.slate200 }
        ]} />
        <Text style={styles.selectedLabel} numberOfLines={1}>
          {selectedBin
            ? <>Ô đã chọn: <Text style={styles.selectedCode}>{selectedBin.code}</Text></>
            : 'Chưa chọn ô — nhấn để chọn'}
        </Text>
        {recommendedBinCodes.length > 0 && (
          <View style={styles.recCountBadge}>
            <Feather name="star" size={9} color={COLORS.success} />
            <Text style={styles.recCountText}>{recommendedBinCodes.length} gợi ý</Text>
          </View>
        )}
      </View>

      {/* Levels and Bins */}
      <View style={styles.levelsList}>
        {shelf.levels.map((level, lIndex) => {
          const bins = level.bins ?? [];
          if (bins.length === 0) return null;

          return (
            <View key={level.id || lIndex} style={styles.levelRow}>
              <View style={styles.levelHeader}>
                <Text style={styles.levelLabel}>Tầng {level.code || lIndex + 1}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.binScroll}
              >
                {bins.map((bin) => {
                  const isRecommended = recommendedBinSet.has(String(bin.code));
                  const isSelected = String(selectedBinId) === String(bin.id);

                  return (
                    <TouchableOpacity
                      key={bin.id}
                      style={[
                        styles.binChip,
                        isRecommended && !isSelected && styles.binChipRecommended,
                        isSelected && styles.binChipSelected,
                      ]}
                      onPress={() => onSelectBin(bin)}
                      activeOpacity={0.75}
                    >
                      {isSelected ? (
                        <Feather name="check" size={12} color="#fff" />
                      ) : isRecommended ? (
                        <Feather name="star" size={11} color={COLORS.success} />
                      ) : null}
                      <Text style={[
                        styles.binChipText,
                        isRecommended && !isSelected && styles.binChipTextRecommended,
                        isSelected && styles.binChipTextSelected,
                      ]}>
                        {bin.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  // ── Selected info ─────────────────────────────────────────────────────────
  selectedInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectedLabel: {
    fontSize: 13,
    color: COLORS.slate500,
    fontWeight: '500',
    flex: 1,
  },
  selectedCode: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  recCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },

  // ── Levels and rows ───────────────────────────────────────────────────────
  levelsList: {
    gap: 12,
  },
  levelRow: {
    gap: 6,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Bin chips ─────────────────────────────────────────────────────────────
  binScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  binChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.slate50,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
  },
  binChipRecommended: {
    backgroundColor: COLORS.success + '08',
    borderColor: COLORS.success + '30',
  },
  binChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  binChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate600,
  },
  binChipTextRecommended: {
    color: COLORS.successText,
  },
  binChipTextSelected: {
    color: '#FFFFFF',
  },
});
