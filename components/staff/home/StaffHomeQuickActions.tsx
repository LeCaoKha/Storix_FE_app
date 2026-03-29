import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/color';

export const StaffHomeQuickActions: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const itemWidth = (width - 40 - 12) / 2; // window width - padding - gap

  const actions = [
    {
      id: 'scan',
      title: 'Quét mã',
      subtitle: 'SKU/Vị trí',
      icon: 'barcode',
      color: COLORS.primary,
      bgColor: COLORS.primaryLight,
      onPress: () => router.push('/(staff-tabs)/tasks'),
    },
    {
      id: 'inventory',
      title: 'Kiểm kho',
      subtitle: 'Tra cứu SKU',
      icon: 'cube',
      color: COLORS.success,
      bgColor: COLORS.successLight,
      onPress: () => router.push('/(staff-tabs)/warehouse'),
    },
    {
      id: 'transfer',
      title: 'Điều chuyển',
      subtitle: 'Nội bộ kho',
      icon: 'swap-horizontal',
      color: COLORS.warning,
      bgColor: COLORS.warningLight,
      onPress: () => router.push('/(staff-tabs)/tasks'),
    },
    {
      id: 'report',
      title: 'Báo cáo',
      subtitle: 'Lỗi/Hỏng',
      icon: 'alert-circle',
      color: COLORS.danger,
      bgColor: COLORS.dangerLight,
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={[styles.actionCard, { width: itemWidth }]}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: action.bgColor }]}>
            <Ionicons name={action.icon as any} size={24} color={action.color} />
          </View>
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
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
