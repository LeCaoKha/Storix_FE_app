import { RefreshContainer, TabScreenHeader } from '@/components';
import { StaffHomeQuickActions } from '@/components/staff/home/StaffHomeQuickActions';
import { StaffHomeStats } from '@/components/staff/home/StaffHomeStats';
import { StaffHomeWarehouseSnapshot } from '@/components/staff/home/StaffHomeWarehouseSnapshot';
import { useInboundOrdersByStaff } from '@/hooks/inbound-orders.hooks';
import { useOutboundTasksByStaff } from '@/hooks/outbound-orders.hooks';
import { useAuthStore } from '@/stores';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function StaffHomeScreen() {
  const user = useAuthStore((state) => state.user);
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  })();
  
  // Fetch tasks to get counts
  const { data: inboundTasks, isLoading: loadingInbound, refetch: refetchInbound } = useInboundOrdersByStaff(user?.companyId ?? 0, user?.id ?? 0);
  const { data: outboundTasks, isLoading: loadingOutbound, refetch: refetchOutbound } = useOutboundTasksByStaff(user?.companyId ?? 0, user?.id ?? 0);

  const stats = {
    inboundCount: inboundTasks?.length ?? 0,
    outboundCount: outboundTasks?.length ?? 0,
    loading: loadingInbound || loadingOutbound,
  };

  const handleRefresh = async () => {
    await Promise.all([
      refetchInbound(),
      refetchOutbound()
    ]);
  };

  return (
    <View style={styles.safeArea}>
      <TabScreenHeader
        title="Trang chủ"
        subtitle={`${greeting}, ${user?.fullName || 'Nhân viên'} • ${user?.warehouseName || 'Chưa xác định'}`}
        useTopSafeArea
      />

      <RefreshContainer
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onRefresh={handleRefresh}
      >
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
      </RefreshContainer>
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B', // COLORS.slate800
    letterSpacing: -0.5,
  },
});
