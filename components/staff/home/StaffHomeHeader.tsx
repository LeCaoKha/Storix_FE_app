import React from 'react';
import { StyleSheet, View, Text, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/color';

interface StaffHomeHeaderProps {
  userName: string;
  warehouseName: string;
}

const { width } = Dimensions.get('window');

export const StaffHomeHeader: React.FC<StaffHomeHeaderProps> = ({ userName, warehouseName }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(57, 198, 198, 0.15)', 'transparent']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.userName} numberOfLines={1}>{userName} 👋</Text>
          <View style={styles.warehouseRow}>
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={12} color={COLORS.primary} />
              <Text style={styles.warehouseName}>{warehouseName}</Text>
            </View>
          </View>
        </View>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarBorder}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color={COLORS.primary} />
            </View>
          </View>
          <View style={styles.statusDot} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 8,
  },
  gradient: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    height: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  userInfo: {
    flex: 1,
    paddingRight: 16,
  },
  greetingText: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.slate900,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  warehouseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  warehouseName: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  avatarContainer: {
    position: 'relative',
    marginTop: 4,
  },
  avatarBorder: {
    padding: 3,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
});
