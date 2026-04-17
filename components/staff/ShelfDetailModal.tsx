import { COLORS } from '@/constants/color';
import { AlertService } from '@/stores/alert.store';
import { useInboundStagingStore } from '@/stores/inbound-staging.store';
import { usePendingQuantitiesStore } from '@/stores/pending-quantities.store';
import { Bin, Shelf, WarehouseZone } from '@/types/warehouse';
import { Feather } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BinSelectionView } from './BinSelectionView';

export interface ShelfActionItem {
  id: number;
  productId: number;
  name: string;
  sku?: string;
  targetQuantity: number;
  currentQuantity: number;
  recommendedQuantity?: number; // USER REQUEST: suggested for this specific shelf
  binCode: string;
  binId: number | string;
  isRecommended?: boolean;
  pendingQuantity?: number;
}

interface ShelfDetailModalProps {
  visible: boolean;
  shelf: Shelf | null;
  zone: WarehouseZone | null;
  onClose: () => void;
  recommendedItems?: ShelfActionItem[];
  onConfirmOperation?: (items: ShelfActionItem[]) => void;
  operationType?: 'inbound' | 'outbound' | 'counting';
  isProcessing?: boolean;
  ticketId?: number;
  shelfId?: string;
}

export const ShelfDetailModal: React.FC<ShelfDetailModalProps> = ({
  visible,
  shelf,
  zone,
  onClose,
  recommendedItems = [],
  onConfirmOperation,
  operationType = 'inbound',
  isProcessing = false,
  ticketId,
  shelfId,
}) => {
  const [selectedBinId, setSelectedBinId] = useState<string | number | undefined>();
  const [renderCounter, setRenderCounter] = useState(0);
  const textInputRefs = useRef<Record<number, string>>({});
  const { getPendingQty, setPendingQty, clearShelfPending } = usePendingQuantitiesStore();

  const isCountingOp = operationType === 'counting';
  const isInbound = operationType === 'inbound';
  const accentColor = isCountingOp ? COLORS.info : (isInbound ? COLORS.success : COLORS.primary);
  const accentLight = isCountingOp ? COLORS.info + '15' : (isInbound ? COLORS.success + '15' : COLORS.primaryLight);

  // Reset selectedBinId when modal opens or shelf changes
  React.useEffect(() => {
    if (visible && shelf) {
      const recommendedBins = (shelf.levels ?? [])
        .flatMap((level) => level.bins ?? [])
        .filter((bin) =>
          recommendedItems.some((item) => {
            const binCodes = String(item.binCode).split(',').map((c) => c.trim());
            return binCodes.includes(String(bin.code));
          })
        );

      if (recommendedBins.length > 0) {
        setSelectedBinId(recommendedBins[0].id);
      } else {
        const firstBin = (shelf.levels?.[0]?.bins ?? [])[0];
        setSelectedBinId(firstBin?.id);
      }
    }
  }, [visible, shelf, recommendedItems]);

  // Restore draft quantities and initialize TextInput refs
  React.useEffect(() => {
    if (!visible) {
      textInputRefs.current = {};
      return;
    }

    recommendedItems.forEach((item) => {
      if (ticketId && shelfId) {
        const pending = getPendingQty(ticketId, item.id, shelfId);
        textInputRefs.current[item.id] = String(pending);
      } else {
        textInputRefs.current[item.id] = '0';
      }
    });
    // Trigger re-render to show loaded values
    setRenderCounter((c) => c + 1);
  }, [visible, recommendedItems, ticketId, shelfId, getPendingQty]);

  // Sync ref values to Zustand store when modal closes or on confirm
  React.useEffect(() => {
    if (!ticketId || !shelfId) return;

    Object.entries(textInputRefs.current).forEach(([itemIdStr, qty]) => {
      const itemId = Number(itemIdStr);
      const numQty = Number(qty || 0);
      setPendingQty(ticketId, itemId, shelfId, numQty);
    });
  }, [renderCounter, ticketId, shelfId, setPendingQty]);

  // Get all recommended bin codes
  const recommendedBinCodes = useMemo(() => {
    return Array.from(
      new Set(
        recommendedItems
          .filter((item) => item.isRecommended)
          .map((item) => item.binCode)
      )
    );
  }, [recommendedItems]);

  const selectedBin = useMemo(() => {
    if (!shelf || !selectedBinId) return undefined;
    return (shelf.levels ?? [])
      .flatMap((level) => level.bins ?? [])
      .find((bin) => String(bin.id) === String(selectedBinId));
  }, [shelf, selectedBinId]);

  const itemsWithSelectedBin = useMemo(() => {
    return recommendedItems.map((item) => {
      const maxQuantity = isCountingOp ? 9999 : Math.max(0, Number(item.targetQuantity || 0));
      const refValue = Number(textInputRefs.current[item.id] || 0);
      const quantity = Math.max(0, Math.min(refValue, maxQuantity));
      return {
        ...item,
        binId: selectedBin?.id ?? item.binId,
        binCode: selectedBin?.code ?? item.binCode,
        pendingQuantity: quantity,
      };
    });
  }, [recommendedItems, selectedBin, isCountingOp, renderCounter]);

  const selectedTotalQuantity = useMemo(
    () => itemsWithSelectedBin.reduce((sum, item) => sum + Number(item.pendingQuantity || 0), 0),
    [itemsWithSelectedBin]
  );

  const updateItemQuantity = useCallback((itemId: number, increment: boolean, maxQuantity: number) => {
    // Update ref value directly
    const current = Number(textInputRefs.current[itemId] || 0);
    const nextValue = increment
      ? Math.min(current + 1, maxQuantity)
      : Math.max(current - 1, 0);
    textInputRefs.current[itemId] = String(nextValue);
    // Trigger re-render to display new value
    setRenderCounter((c) => c + 1);
  }, []);

  const updateItemQuantityFromInput = useCallback((itemId: number, value: string, maxQuantity: number) => {
    // Store the raw input in ref only (don't update state to avoid TextInput re-renders)
    const sanitized = value.replace(/[^0-9]/g, '');
    textInputRefs.current[itemId] = sanitized;
  }, []);

  const handleConfirmPress = useCallback(() => {
    if (!onConfirmOperation) return;

    // Sync all ref values to state before processing
    const syncedQuantities: Record<number, number> = {};
    recommendedItems.forEach((item) => {
      const refValue = textInputRefs.current[item.id] || '0';
      const maxQuantity = isCountingOp ? 9999 : Math.max(0, Number(item.targetQuantity || 0));
      const numValue = Math.min(Math.max(Number(refValue || 0), 0), maxQuantity);
      syncedQuantities[item.id] = numValue;
    });

    if (!isCountingOp && Object.values(syncedQuantities).reduce((sum, v) => sum + v, 0) <= 0) {
      AlertService.warning('Chưa chọn số lượng', 'Vui lòng nhập số lượng lớn hơn 0 trước khi xác nhận.');
      return;
    }

    // Update state with synced values
    // Create items with synced bin and quantities
    const itemsToProcess = recommendedItems.map((item) => {
      return {
        ...item,
        binId: selectedBin?.id ?? item.binId,
        binCode: selectedBin?.code ?? item.binCode,
        pendingQuantity: syncedQuantities[item.id],
      };
    });

    onConfirmOperation(itemsToProcess);

    // Clear persisted pending quantities immediately
    if (ticketId && shelfId) {
      clearShelfPending(ticketId, shelfId);
    }

    // Reset refs for next operation
    recommendedItems.forEach((item) => {
      textInputRefs.current[item.id] = '0';
    });
    setRenderCounter((c) => c + 1);
  }, [onConfirmOperation, isCountingOp, selectedBin, ticketId, shelfId, clearShelfPending, recommendedItems]);

  if (!shelf || !zone) return null;

  const hasItems = recommendedItems.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>

          {/* Drag handle */}
          <View style={styles.dragHandle} />

          {/* ── Header ──────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: accentLight }]}>
              <Feather
                name={isInbound ? 'arrow-down-circle' : 'arrow-up-circle'}
                size={22}
                color={accentColor}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerShelfCode}>{shelf.code}</Text>
              <Text style={styles.headerZone}>
                {zone.code}
                {' · '}
                {(shelf.levels ?? []).length} tầng
                {' · '}
                {(shelf.levels ?? []).reduce((acc, l) => acc + (l.bins?.length ?? 0), 0)} ô
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={18} color={COLORS.slate500} />
            </TouchableOpacity>
          </View>

          {/* ── Scrollable content ──────────────────────────────────── */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {hasItems ? (
              <>
                {/* Bin selection */}
                {!isCountingOp && (
                  <View style={styles.section}>
                    <View style={styles.sectionLabelRow}>
                      <View style={[styles.sectionDot, { backgroundColor: accentColor }]} />
                      <Text style={styles.sectionLabel}>Chọn ô đặt hàng</Text>
                    </View>
                    <BinSelectionView
                      shelf={shelf}
                      selectedBinId={selectedBinId}
                      recommendedBinCodes={recommendedBinCodes}
                      onSelectBin={(bin: Bin) => setSelectedBinId(bin.id)}
                    />
                  </View>
                )}

                {!isCountingOp && <View style={styles.divider} />}

                {/* Item list */}
                <View style={styles.section}>
                  <View style={styles.sectionLabelRow}>
                    <View style={[styles.sectionDot, { backgroundColor: accentColor }]} />
                    <Text style={styles.sectionLabel}>
                      {isCountingOp ? 'Hàng cần kiểm kê' : (isInbound ? 'Hàng cần xếp' : 'Hàng cần nhặt')}
                    </Text>
                    <View style={[styles.countBadge, { backgroundColor: accentLight }]}>
                      <Text style={[styles.countBadgeText, { color: accentColor }]}>
                        {recommendedItems.length}
                      </Text>
                    </View>
                  </View>

                  {recommendedItems.map((item) => {
                    const qty = Number(textInputRefs.current[item.id] ?? 0);
                    const targetQty = Math.max(0, Number(item.targetQuantity || 0));
                    const done = Number(item.currentQuantity || 0);
                    const maxAdjustable = isCountingOp ? 9999 : Math.max(0, targetQty - done);
                    
                    // Logic fix: projectedDone is what's already in other bins + what's being entered now
                    const projectedDone = Math.min(done + qty, targetQty);
                    
                    // Logic fix: projectedRemaining is what's still left to reach the target
                    const projectedRemaining = Math.max(0, targetQty - projectedDone);
                    
                    const progress = targetQty > 0 ? Math.min(projectedDone / targetQty, 1) : 0;
                    const activeBinCode = selectedBin?.code ?? item.binCode;

                    const handleResetItem = () => {
                      AlertService.confirm(
                        'Xóa tiến độ?',
                        `Bạn có muốn xóa toàn bộ số lượng đã xếp của mặt hàng "${item.name}" trên tất cả các kệ không?`,
                        () => {
                          const { clearItem } = useInboundStagingStore.getState();
                          if (ticketId) clearItem(ticketId, item.id);
                          AlertService.success('Đã xóa', 'Tiến độ của mặt hàng này đã được reset.');
                        }
                      );
                    };

                    return (
                      <View key={item.id} style={styles.itemCard}>
                        {/* Item info */}
                        <View style={styles.itemTop}>
                          <View style={styles.itemInfo}>
                            <View style={styles.itemNameRow}>
                              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                {item.isRecommended && (
                                  <View style={[styles.recTag, { backgroundColor: accentLight }]}>
                                    <Feather name="star" size={9} color={accentColor} />
                                    <Text style={[styles.recTagText, { color: accentColor }]}>Gợi ý</Text>
                                  </View>
                                )}
                                {!isCountingOp && projectedDone > 0 && (
                                  <TouchableOpacity onPress={handleResetItem} activeOpacity={0.6}>
                                    <View style={[styles.recTag, { backgroundColor: COLORS.danger + '10' }]}>
                                      <Feather name="rotate-ccw" size={9} color={COLORS.danger} />
                                      <Text style={[styles.recTagText, { color: COLORS.danger }]}>Reset</Text>
                                    </View>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                            <View style={styles.itemMetaRow}>
                              {item.sku && (
                                <Text style={styles.metaChip}>{item.sku}</Text>
                              )}
                              <View style={[styles.binTag, { backgroundColor: accentLight, borderColor: accentColor + '30' }]}>
                                <Feather name="map-pin" size={10} color={accentColor} />
                                <Text style={[styles.binTagText, { color: accentColor }]}>
                                  {activeBinCode}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>

                        {/* Progress bar */}
                        {!isCountingOp && (
                          <View style={styles.progressWrap}>
                            <View style={styles.progressTrack}>
                              <View style={[styles.progressFill, {
                                width: `${progress * 100}%` as any,
                                backgroundColor: accentColor,
                              }]} />
                            </View>
                            <Text style={styles.progressLabel}>
                              {projectedDone}/{item.targetQuantity}
                            </Text>
                          </View>
                        )}

                        {/* Quantity controls */}
                        <View style={styles.qtyRow}>
                          <View style={styles.qtyHintWrap}>
                            <Text style={styles.qtyHintMain}>
                              {isCountingOp ? 'Sẽ ghi nhận số lượng kiểm kê' : (isInbound ? 'Sẽ nhập vào ô này' : 'Sẽ nhặt từ ô này')}
                            </Text>
                            
                            {!isCountingOp && item.recommendedQuantity !== undefined && item.recommendedQuantity > 0 && (
                              <View style={styles.recHintRow}>
                                <Feather name="info" size={10} color={COLORS.primary} />
                                <Text style={styles.recHintText}>
                                  Gợi ý tại kệ này: <Text style={{ fontWeight: '800' }}>{item.recommendedQuantity}</Text>
                                </Text>
                              </View>
                            )}

                            {!isCountingOp && (
                              <Text style={styles.qtyHintSub}>
                                <Text style={{ color: COLORS.slate400 }}>Còn thiếu:</Text> <Text style={{ fontWeight: '700', color: projectedRemaining > 0 ? COLORS.warning : COLORS.slate700 }}>{projectedRemaining}</Text>
                                {' · '}<Text style={{ color: COLORS.slate400 }}>Tổng xong:</Text> <Text style={{ fontWeight: '700', color: progress >= 1 ? COLORS.success : accentColor }}>{projectedDone}/{item.targetQuantity}</Text>
                              </Text>
                            )}
                          </View>

                          <View style={styles.qtyControls}>
                            <TouchableOpacity
                              style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}
                              onPress={() => updateItemQuantity(item.id, false, maxAdjustable)}
                              activeOpacity={0.7}
                              disabled={qty === 0}
                            >
                              <Feather name="minus" size={16} color={qty === 0 ? COLORS.slate300 : accentColor} />
                            </TouchableOpacity>

                            <TextInput
                              style={[
                                styles.qtyInput,
                                (textInputRefs.current[item.id] || '') !== '0' && { borderColor: accentColor + '40', backgroundColor: accentLight, color: accentColor },
                              ]}
                              value={textInputRefs.current[item.id] ?? '0'}
                              onChangeText={(text) => updateItemQuantityFromInput(item.id, text, maxAdjustable)}
                              keyboardType="number-pad"
                              inputMode="numeric"
                              returnKeyType="done"
                              textAlign="center"
                              textAlignVertical="center"
                              maxLength={4}
                              selectTextOnFocus
                            />

                            <TouchableOpacity
                              style={[styles.qtyBtn, qty >= maxAdjustable && styles.qtyBtnDisabled]}
                              onPress={() => updateItemQuantity(item.id, true, maxAdjustable)}
                              activeOpacity={0.7}
                              disabled={qty >= maxAdjustable}
                            >
                              <Feather name="plus" size={16} color={qty >= maxAdjustable ? COLORS.slate300 : accentColor} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : (
              /* No items state */
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIcon}>
                  <Feather name="check-circle" size={32} color={COLORS.slate300} />
                </View>
                <Text style={styles.emptyTitle}>Không có hàng cho kệ này</Text>
                <Text style={styles.emptySubtitle}>
                  Kệ{' '}<Text style={{ fontWeight: '700' }}>{shelf.code}</Text>{' '}không có mặt hàng nào trong phiếu này.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* ── Footer / Confirm button ─────────────────────────────── */}
          {hasItems && onConfirmOperation && (
            <View style={styles.footer}>
              {/* Summary row */}
              {selectedTotalQuantity > 0 && (
                <View style={[styles.summaryRow, { backgroundColor: accentLight }]}>
                  <Feather name="package" size={13} color={accentColor} />
                  <Text style={[styles.summaryText, { color: accentColor }]}>
                    {isCountingOp ? 'Sẽ ghi nhận' : (isInbound ? 'Sẽ nhập' : 'Sẽ nhặt')}{' '}
                    <Text style={{ fontWeight: '800' }}>{selectedTotalQuantity}</Text> sản phẩm
                    {!isCountingOp && selectedBin ? <> vào ô <Text style={{ fontWeight: '800' }}>{selectedBin.code}</Text></> : ''}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: accentColor },
                  (isProcessing || (!isCountingOp && selectedTotalQuantity === 0)) && styles.confirmBtnDisabled,
                ]}
                onPress={handleConfirmPress}
                disabled={isProcessing || (!isCountingOp && selectedTotalQuantity === 0)}
                activeOpacity={0.85}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="check-circle" size={18} color="#fff" />
                    <Text style={styles.confirmBtnText}>
                      {isCountingOp
                        ? 'Xác nhận kiểm kê'
                        : (selectedTotalQuantity === 0
                            ? `Chọn số lượng cần ${isInbound ? 'nhập' : 'nhặt'}`
                            : `Xác nhận ${isInbound ? 'nhập' : 'nhặt'} ${selectedTotalQuantity} sản phẩm`)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 8, 23, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    // flexShrink:1 makes the sheet respect maxHeight properly
    // so its flex children (ScrollView) get the right available space
    flexShrink: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  // ── Drag handle ───────────────────────────────────────────────────────────
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.slate200,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerShelfCode: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.slate800,
    letterSpacing: -0.5,
  },
  headerZone: {
    fontSize: 12,
    color: COLORS.slate400,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.slate700,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: 20,
  },

  // ── Item card ─────────────────────────────────────────────────────────────
  itemCard: {
    backgroundColor: COLORS.slate50,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    gap: 10,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    gap: 6,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate800,
    flex: 1,
  },
  recTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  recTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaChip: {
    fontSize: 11,
    color: COLORS.slate400,
    fontWeight: '600',
    backgroundColor: COLORS.slate100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  binTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  binTagText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Progress ──────────────────────────────────────────────────────────────
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.slate200,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate500,
    minWidth: 36,
    textAlign: 'right',
  },

  // ── Quantity controls ─────────────────────────────────────────────────────
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  qtyHintWrap: {
    flex: 1,
    gap: 2,
  },
  qtyHintMain: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate600,
  },
  qtyHintSub: {
    fontSize: 11,
    color: COLORS.slate400,
    fontWeight: '500',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyInput: {
    width: 54,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
    paddingHorizontal: 8,
    paddingVertical: 0,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.slate700,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 20,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate600,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.slate400,
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Footer / Confirm ──────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  confirmBtnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  recHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '08',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginVertical: 4,
    alignSelf: 'flex-start',
  },
  recHintText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
