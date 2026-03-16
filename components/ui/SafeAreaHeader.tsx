import { useAppBack } from '@/hooks/useAppBack';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTopSafePadding } from './safeArea';

interface SafeAreaHeaderProps {
  title?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  children?: React.ReactNode;
  backgroundColor?: string;
  style?: any;
}

export const SafeAreaHeader: React.FC<SafeAreaHeaderProps> = ({
  title,
  onBack,
  showBackButton = true,
  children,
  backgroundColor,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const goBack = useAppBack();

  return (
    <View style={[styles.header, { paddingTop: getTopSafePadding(insets.top, 8) }, backgroundColor ? { backgroundColor } : {}, style]}>
      <View style={styles.content}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={onBack || goBack}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
        {children || <Text style={styles.title}>{title}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
  },
});