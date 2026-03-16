import { COLORS } from '@/constants/color';
import { TransferOrder } from '@/types/transfer';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TransferCardProps {
  transfer: TransferOrder;
  onPress: () => void;
}

export const TransferCard: React.FC<TransferCardProps> = ({
  transfer,
  onPress,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return COLORS.success;
      case 'approved': return COLORS.primary;
      case 'pending_approval': return COLORS.warning;
      case 'picking': return '#F59E0B'; // Amber
      case 'packed': return '#8B5CF6'; // Purple
      case 'in_transit': return '#3B82F6'; // Blue
      case 'draft': return COLORS.slate500;
      case 'cancelled':
      case 'rejected': return COLORS.danger;
      default: return COLORS.slate500;
    }
  };

  const statusColor = getStatusColor(transfer.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {transfer.referenceCode || `Phiếu #${transfer.id}`}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
      </View>

      <View style={styles.locations}>
        <View style={styles.locationItem}>
          <Feather name="log-out" size={14} color={COLORS.danger} />
          <Text style={styles.locationText} numberOfLines={1}>
            Từ: {transfer.sourceWarehouse?.name || `Kho ${transfer.sourceWarehouseId}`}
          </Text>
        </View>
        <Feather name="arrow-right" size={14} color={COLORS.textMuted} style={styles.arrow} />
        <View style={styles.locationItem}>
          <Feather name="log-in" size={14} color={COLORS.success} />
          <Text style={styles.locationText} numberOfLines={1}>
            Đến: {transfer.destinationWarehouse?.name || `Kho ${transfer.destinationWarehouseId}`}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dateTag}>
          <Feather name="clock" size={12} color={COLORS.textMuted} />
          <Text style={styles.dateText}>
            {new Date(transfer.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '10' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {transfer.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  locations: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border,
    paddingLeft: 12,
    marginBottom: 16,
    gap: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  arrow: {
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
