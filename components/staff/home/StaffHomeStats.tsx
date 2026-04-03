import { COLORS } from '@/constants/color';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
        style={[styles.card, { borderLeftColor: COLORS.primary }]} 
        onPress={handleNavigateToTasks}
        activeOpacity={0.8}
      >
        <View style={styles.cardBody}>
          <Text style={styles.label}>Chờ nhập kho</Text>
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
        style={[styles.card, { borderLeftColor: COLORS.warning }]} 
        onPress={handleNavigateToTasks}
        activeOpacity={0.8}
      >
        <View style={styles.cardBody}>
          <Text style={styles.label}>Chờ xuất kho</Text>
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
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderLeftWidth: 4, // Add a subtle accent bar
  },
  cardBody: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#64748B', // COLORS.slate500
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  value: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A', // COLORS.slate900
  },
  unit: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    marginLeft: 4,
  },
  loader: {
    alignSelf: 'flex-start',
    marginTop: 12,
  }
});
