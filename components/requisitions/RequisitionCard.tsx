import { COLORS } from '@/constants/color';
import { GoodsRequisition } from '@/types/requisition';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RequisitionCardProps {
  requisition: GoodsRequisition;
  onPress?: () => void;
}

export const RequisitionCard: React.FC<RequisitionCardProps> = ({
  requisition,
  onPress,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'rejected':
        return COLORS.danger;
      default:
        return COLORS.slate500;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.id}>#{requisition.requisitionNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(requisition.status) }]}>
          <Text style={styles.statusText}>{requisition.status}</Text>
        </View>
      </View>
      <Text style={styles.title}>{requisition.purpose}</Text>
      <View style={styles.footer}>
        <Text style={styles.date}>
          {typeof requisition.createdAt === 'string'
            ? new Date(requisition.createdAt).toLocaleDateString('vi-VN')
            : requisition.createdAt.toLocaleDateString('vi-VN')}
        </Text>
        <Text style={styles.itemCount}>{requisition.items.length} items</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  id: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  itemCount: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
});