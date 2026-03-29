import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/color';

interface StaffHomeStatsProps {
  inboundCount: number;
  outboundCount: number;
  loading: boolean;
}

export const StaffHomeStats: React.FC<StaffHomeStatsProps> = ({ inboundCount, outboundCount, loading }) => {
  const router = useRouter();

  const handleNavigateToTasks = () => {
    router.push('/(staff-tabs)/tasks');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.card} 
        onPress={handleNavigateToTasks}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: COLORS.primaryLight }]}>
            <Ionicons name="download" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.trendBadge}>
            <Ionicons name="trending-up" size={10} color={COLORS.success} />
            <Text style={styles.trendText}>+12%</Text>
          </View>
        </View>
        
        <View style={styles.cardBody}>
          <Text style={styles.label}>Nhập kho</Text>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
          ) : (
            <View style={styles.valueRow}>
              <Text style={styles.value}>{inboundCount}</Text>
              <Text style={styles.unit}> phiếu</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.card} 
        onPress={handleNavigateToTasks}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: COLORS.warningLight }]}>
            <Ionicons name="share" size={24} color={COLORS.warning} />
          </View>
          <View style={[styles.trendBadge, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="trending-up" size={10} color={COLORS.success} />
            <Text style={styles.trendText}>+5%</Text>
          </View>
        </View>
        
        <View style={styles.cardBody}>
          <Text style={styles.label}>Xuất kho</Text>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.warning} style={styles.loader} />
          ) : (
            <View style={styles.valueRow}>
              <Text style={styles.value}>{outboundCount}</Text>
              <Text style={styles.unit}> phiếu</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  cardBody: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.slate900,
  },
  unit: {
    fontSize: 13,
    color: COLORS.textSubtle,
    fontWeight: '500',
    marginLeft: 2,
  },
  loader: {
    alignSelf: 'flex-start',
    marginTop: 8,
  }
});
