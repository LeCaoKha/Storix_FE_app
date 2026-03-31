import { COLORS } from '@/constants/color';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StaffHomeHeaderProps {
  userName: string;
  warehouseName: string;
}

export const StaffHomeHeader: React.FC<StaffHomeHeaderProps> = ({ userName, warehouseName }) => {
  const insets = useSafeAreaInsets();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const capitalizeName = (name: string) => {
    if (!name) return 'Nhân viên';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>Trang chủ</Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {getGreeting()}, {capitalizeName(userName)} • {warehouseName}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  }
});
