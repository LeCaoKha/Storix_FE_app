import { RequisitionItem } from '@/types/requisition';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

interface RequisitionItemListProps {
  items: RequisitionItem[];
  showNotes?: boolean;
}

export const RequisitionItemList: React.FC<RequisitionItemListProps> = ({ items, showNotes }) => {
  const renderItem = ({ item }: { item: RequisitionItem }) => (
    <View style={styles.item}>
      <Text style={styles.productName}>{item.productName}</Text>
      <Text style={styles.quantity}>{item.quantity} {item.unit}</Text>
      {showNotes && item.notes && (
        <Text style={styles.description}>{item.notes}</Text>
      )}
    </View>
  );

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
  description: {
    fontSize: 14,
    color: '#6B7280',
  },
});