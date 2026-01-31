import { COLORS } from '@/constants/color';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface BackButtonProps {
    onPress?: () => void;
    color?: string;
    size?: number;
}

export function BackButton({ onPress, color = COLORS.text, size = 24 }: BackButtonProps) {
    const router = useRouter();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.back();
        }
    };

    return (
        <TouchableOpacity onPress={handlePress} style={styles.button}>
            <Feather name="arrow-left" size={size} color={color} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        padding: 8,
        marginRight: 8,
        marginLeft: -8,
    },
});
