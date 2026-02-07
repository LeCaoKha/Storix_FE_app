import { getLatestPrice } from '@/types/product';
import { RequisitionItem } from '@/types/requisition';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

interface RequisitionItemListProps {
  items: RequisitionItem[];
  showNotes?: boolean;
}

export const RequisitionItemList: React.FC<RequisitionItemListProps> = ({ items, showNotes }) => {
  const renderItem = ({ item }: { item: RequisitionItem }) => {
    const latestPrice = item.product ? getLatestPrice(item.product) : 0;
    const totalPrice = latestPrice * item.quantity;

    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.productName}>{item.productName}</Text>
            <View style={styles.qtyBadge}>
              <Text style={styles.quantity}>{item.quantity} {item.unit}</Text>
            </View>
          </View>
        </View>
        {latestPrice !== undefined && (
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Feather name="tag" size={12} color="#6B7280" />
              <Text style={styles.priceUnit}>
                {latestPrice.toLocaleString('vi-VN')} ₫/đơn vị
              </Text>
            </View>
            <View style={styles.totalPriceRow}>
              <Feather name="dollar-sign" size={14} color="#22C55E" />
              <Text style={styles.totalPriceLabel}>Tổng:</Text>
              <Text style={styles.totalPriceValue}>
                {totalPrice.toLocaleString('vi-VN')} ₫
              </Text>
            </View>
          </View>
        )}
        {showNotes && item.notes && (
          <Text style={styles.description}>{item.notes}</Text>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      style={styles.list}
      scrollEnabled={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  item: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  qtyBadge: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  itemHeader: {
    marginBottom: 8,
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceUnit: {
    fontSize: 12,
    color: '#6B7280',
  },
  totalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  totalPriceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
  },
  totalPriceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});