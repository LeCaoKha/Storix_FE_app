import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'outline';
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  'pending': { label: 'Chờ duyệt', color: '#FF9500' },
  'approve': { label: 'Đã duyệt', color: '#34C759' },
  'approved': { label: 'Đã duyệt', color: '#34C759' },
  'rejected': { label: 'Từ chối', color: '#FF3B30' },
  'cancelled': { label: 'Đã hủy', color: '#FF3B30' },
  'transported': { label: 'Đang vận chuyển', color: '#007AFF' },
  'completed': { label: 'Hoàn tất', color: '#34C759' },
  'waiting for payment': { label: 'Chờ nhận hàng', color: '#FF9500' },
  'partially completed': { label: 'Đang nhập', color: '#007AFF' },
  'in_progress': { label: 'Đang xử lý', color: '#FF9500' },
  'created': { label: 'Đã tạo', color: '#007AFF' },
  'picking': { label: 'Đang lấy hàng', color: '#007AFF' },
  'qualitycheck': { label: 'Kiểm tra CL', color: '#6B7280' },
  'issuereported': { label: 'Có vấn đề', color: '#FF3B30' },
  'packing': { label: 'Đóng gói', color: '#007AFF' },
  'loadhandover': { label: 'Chờ xác nhận', color: '#FF9500' },
  'draft': { label: 'Nháp', color: '#8E8E93' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  variant = 'default' 
}) => {
  const key = status?.toLowerCase().trim() || '';
  const config = STATUS_MAP[key] || { label: status, color: '#6B7280' };
  const isOutline = variant === 'outline';

  return (
    <View 
      style={[
        styles.badge,
        {
          backgroundColor: isOutline ? 'transparent' : config.color,
          borderColor: config.color,
          borderWidth: isOutline ? 1 : 0,
        }
      ]}
    >
      <Text 
        style={[
          styles.text, 
          { color: isOutline ? config.color : '#fff' }
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});