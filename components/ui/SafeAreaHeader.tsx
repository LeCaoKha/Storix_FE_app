import { COLORS } from '@/constants/color';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import { Platform, StatusBar, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

interface SafeAreaHeaderProps {
    children: ReactNode;
    backgroundColor?: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    style?: ViewStyle;
}

export function SafeAreaHeader({
    children,
    backgroundColor = '#fff',
    showBackButton = false,
    onBackPress,
    style,
}: SafeAreaHeaderProps) {
    const router = useRouter();

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            router.back();
        }
    };

    // Calculate safe area top padding
    const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 44;
    const paddingTop = statusBarHeight + 16; // 16px additional padding

    return (
        <View style={[styles.container, { backgroundColor, paddingTop }, style]}>
            <View style={styles.headerContent}>
                {showBackButton && (
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                )}
                <View style={styles.childrenContainer}>
                    {children}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 16,
        paddingHorizontal: 20, // Default padding for all headers
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 12, // Match Manager style spacing
    },
    childrenContainer: {
        flex: 1,
        justifyContent: 'center',
    },
});
