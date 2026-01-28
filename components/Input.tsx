import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { COLORS } from '../constants/color';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    style,
    ...props
}) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, error ? styles.inputError : null]}>
                {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
                <TextInput
                    style={[styles.input, leftIcon ? styles.inputWithIcon : null, style]}
                    placeholderTextColor={COLORS.textMuted}
                    {...props}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        backgroundColor: COLORS.card,
        height: 50,
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        color: COLORS.text,
        height: '100%',
    },
    inputWithIcon: {
        paddingLeft: 8,
    },
    iconContainer: {
        paddingLeft: 16,
    },
    inputError: {
        borderColor: COLORS.danger,
    },
    errorText: {
        marginTop: 4,
        fontSize: 12,
        color: COLORS.danger,
    }
});
