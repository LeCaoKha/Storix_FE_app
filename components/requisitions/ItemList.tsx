import { getLatestPrice } from '@/types/product';
import { RequisitionItem } from '@/types/requisition';
import { formatVND } from '@/utils/format';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RequisitionItemListProps {
  items: RequisitionItem[];
  showNotes?: boolean;
}

export const RequisitionItemList: React.FC<RequisitionItemListProps> = ({ items, showNotes }) => {
  const renderItem = ({ item, index }: { item: RequisitionItem; index: number }) => {
    const latestPrice = item.product ? getLatestPrice(item.product) : 0;
    const totalPrice = latestPrice * item.quantity;

    return (
      <View key={item.id}>
        <View style={styles.itemContent}>
          {/* Top Row: Name and SKU */}
          <View style={styles.itemMainInfo}>
            <View style={styles.itemHeader}>
              <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
              <Text style={styles.itemSku}>SKU: {item.sku}</Text>
            </View>
            <View style={styles.qtyBadge}>
              <Text style={styles.quantityText}>{item.quantity} {item.unit}</Text>
            </View>
          </View>

          {/* Bottom Row: Prices */}
          <View style={styles.itemFooter}>
            <View style={styles.priceSection}>
              <Text style={styles.unitPriceText}>
                {formatVND(latestPrice)}/đv
              </Text>
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>THÀNH TIỀN</Text>
                <Text style={styles.totalValue}>{formatVND(totalPrice)}</Text>
              </View>
            </View>
          </View>
        </View>
        {showNotes && item.notes && (
          <View style={styles.notesContainer}>
            <Feather name="file-text" size={12} color="#94A3B8" />
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={item.id}>
          {renderItem({ item, index })}
          {index < items.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemContent: {
    padding: 16,
  },
  itemMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemHeader: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  qtyBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceSection: {
    flex: 1,
  },
  unitPriceText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  totalSection: {
    gap: 2,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#10B981',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  notesText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
});
