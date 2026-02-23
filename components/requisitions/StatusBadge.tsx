import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'outline';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  variant = 'default' 
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return '#34C759';
      case 'pending':
      case 'in_progress':
      case 'waiting for payment':
      case 'partially completed':
        return '#FF9500';
      case 'rejected':
      case 'cancelled':
      case 'issuereported':
        return '#FF3B30';
      case 'draft':
        return '#8E8E93';
      case 'transported':
      case 'picking':
      case 'qualitycheck':
      case 'packing':
      case 'loadhandover':
      case 'created':
        return '#007AFF';
      default:
        return '#6B7280';
    }
  };

  const color = getStatusColor(status);
  const isOutline = variant === 'outline';

  return (
    <View 
      style={[
        styles.badge,
        {
          backgroundColor: isOutline ? 'transparent' : color,
          borderColor: color,
          borderWidth: isOutline ? 1 : 0,
        }
      ]}
    >
      <Text 
        style={[
          styles.text, 
          { color: isOutline ? color : '#fff' }
        ]}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
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