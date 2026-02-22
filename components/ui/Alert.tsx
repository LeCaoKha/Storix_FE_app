import { COLORS } from '@/constants/color';
import { useAlertStore } from '@/stores/alert.store';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut, FadeOutDown } from 'react-native-reanimated';

export default function AlertContainer() {
    const { visible, title, message, type, buttons, hideAlert, onDismiss } = useAlertStore();

    useEffect(() => {
        if (visible) {
            // Trigger haptics based on type
            switch (type) {
                case 'success':
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    break;
                case 'error':
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    break;
                case 'warning':
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    break;
                default:
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
        }
    }, [visible, type]);

    const handleClose = () => {
        hideAlert();
        onDismiss?.();
    };

    const getIconConfig = () => {
        switch (type) {
            case 'success': return { name: 'check-circle' as const, color: COLORS.success, bg: COLORS.success + '15' };
            case 'error': return { name: 'x-circle' as const, color: COLORS.danger, bg: COLORS.danger + '15' };
            case 'warning': return { name: 'alert-triangle' as const, color: COLORS.warning, bg: COLORS.warning + '15' };
            case 'confirm': return { name: 'help-circle' as const, color: COLORS.primary, bg: COLORS.primary + '15' };
            default: return { name: 'info' as const, color: COLORS.primary, bg: COLORS.primary + '15' };
        }
    };

    const icon = getIconConfig();

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={StyleSheet.absoluteFill}
                >
                    <Pressable style={styles.backdrop} onPress={type !== 'confirm' ? handleClose : undefined} />
                </Animated.View>

                <Animated.View
                    entering={FadeInUp.springify().damping(15)}
                    exiting={FadeOutDown.duration(150)}
                    style={styles.alertBox}
                >
                    {/* Header Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
                        <Feather name={icon.name} size={32} color={icon.color} />
                    </View>

                    {/* Text Content */}
                    <View style={styles.content}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        {buttons && buttons.length > 0 ? (
                            buttons.map((btn, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        index > 0 && styles.buttonMargin,
                                        btn.style === 'destructive' && styles.btnDestructive,
                                        btn.style === 'cancel' && styles.btnCancel,
                                    ]}
                                    onPress={() => {
                                        btn.onPress?.();
                                        hideAlert();
                                    }}
                                >
                                    <Text style={[
                                        styles.buttonText,
                                        btn.style === 'cancel' && styles.buttonTextCancel
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleClose}
                            >
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.primary + 'EE']}
                                    style={styles.gradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.primaryButtonText}>Đóng</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    alertBox: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    content: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
    },
    button: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
    },
    buttonMargin: {
        marginLeft: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    btnDestructive: {
        backgroundColor: COLORS.danger,
    },
    btnCancel: {
        backgroundColor: '#F3F4F6',
    },
    buttonTextCancel: {
        color: '#4B5563',
    },
    primaryButton: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
