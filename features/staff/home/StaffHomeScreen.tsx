import React from 'react';
import { ScrollView, StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { useAuthStore } from '@/stores';
import { useInboundOrdersByStaff } from '@/hooks/inbound-orders.hooks';
import { useOutboundTasksByStaff } from '@/hooks/outbound-orders.hooks';
import { StaffHomeHeader } from '@/components/staff/home/StaffHomeHeader';
import { StaffHomeStats } from '@/components/staff/home/StaffHomeStats';
import { StaffHomeQuickActions } from '@/components/staff/home/StaffHomeQuickActions';
import { StaffHomeWarehouseSnapshot } from '@/components/staff/home/StaffHomeWarehouseSnapshot';

export default function StaffHomeScreen() {
  const user = useAuthStore((state) => state.user);
  
  // Fetch tasks to get counts
  const { data: inboundTasks, isLoading: loadingInbound } = useInboundOrdersByStaff(user?.companyId ?? 0, user?.id ?? 0);
  const { data: outboundTasks, isLoading: loadingOutbound } = useOutboundTasksByStaff(user?.companyId ?? 0, user?.id ?? 0);

  const stats = {
    inboundCount: inboundTasks?.length ?? 0,
    outboundCount: outboundTasks?.length ?? 0,
    loading: loadingInbound || loadingOutbound,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StaffHomeHeader 
          userName={user?.fullName || 'Nhân viên'} 
          warehouseName={user?.warehouseName || 'Chưa xác định'} 
        />
        
        <StaffHomeStats 
          inboundCount={stats.inboundCount}
          outboundCount={stats.outboundCount}
          loading={stats.loading}
        />
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        </View>
        <StaffHomeQuickActions />
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sơ đồ kho hiện tại</Text>
        </View>
        <StaffHomeWarehouseSnapshot warehouseId={user?.warehouseId} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Match COLORS.background slate-50
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginTop: 32, // More "breathing" space
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20, // Hierarchy upgrade
    fontWeight: '700',
    color: '#1E293B', // COLORS.slate800
    letterSpacing: -0.5,
  },
});
