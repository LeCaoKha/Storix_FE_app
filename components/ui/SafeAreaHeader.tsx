import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  return (
    <View style={[styles.header, backgroundColor ? { backgroundColor } : {}, style]}>
      <View style={styles.content}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
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
    paddingTop: 44, // Safe area top
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