import { COLORS } from '@/constants/color';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

export const StaffHomeQuickActions: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const itemWidth = (width - 40 - 12) / 2; // window width - padding - gap

  const actions = [
    {
      id: 'scan',
      title: 'Quét mã',
      subtitle: 'SKU/Vị trí',
      color: COLORS.primary,
      onPress: () => router.push('/(staff-tabs)/tasks'),
    },
    {
      id: 'inventory',
      title: 'Kiểm kho',
      subtitle: 'Tra cứu SKU',
      color: COLORS.success,
      onPress: () => router.push('/(staff-tabs)/warehouse'),
    },
    {
      id: 'transfer',
      title: 'Điều chuyển',
      subtitle: 'Nội bộ kho',
      color: COLORS.warning,
      onPress: () => router.push('/(staff-tabs)/tasks'),
    },
    {
      id: 'report',
      title: 'Báo cáo',
      subtitle: 'Lỗi/Hỏng',
      color: COLORS.danger,
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={[styles.actionCard, { width: itemWidth, borderLeftColor: action.color }]}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.textContainer}>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle} numberOfLines={1}>{action.subtitle}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
