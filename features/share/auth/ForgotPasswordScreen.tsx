import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button, Input, SafeAreaHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useAppBack } from '@/hooks/useAppBack';
import { useTranslation } from '@/hooks/useTranslation';
import { AlertService } from '@/stores/alert.store';

export default function ForgotPasswordScreen() {
    const { t } = useTranslation();
    const goBack = useAppBack('/login');
    const [email, setEmail] = useState('');

    const handleContactAdmin = () => {
        if (!email.trim()) {
            AlertService.warning(t('common.error'), t('auth.enterEmail'));
            return;
        }

        AlertService.info(t('auth.contactAdmin'), t('auth.forgotPasswordNote'));
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <SafeAreaHeader title={t('auth.forgotPasswordTitle')} onBack={goBack} />

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.hero}>
                    <View style={styles.iconContainer}>
                        <Feather name="lock" size={40} color={COLORS.primary} />
                    </View>
                    <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
                    <Text style={styles.subtitle}>{t('auth.forgotPasswordSubtitle')}</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('auth.email')}</Text>
                        <Input
                            placeholder={t('auth.enterEmail')}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            leftIcon={<Feather name="mail" size={20} color={COLORS.slate500} />}
                            style={styles.input}
                        />
                    </View>

                    <View style={styles.noteBox}>
                        <Feather name="info" size={16} color={COLORS.primaryDark} />
                        <Text style={styles.noteText}>{t('auth.forgotPasswordNote')}</Text>
                    </View>

                    <Button title={t('auth.forgotPasswordAction')} onPress={handleContactAdmin} style={styles.actionButton} />

                    <TouchableOpacity onPress={goBack} style={styles.backLink}>
                        <Text style={styles.backLinkText}>{t('common.back')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    hero: {
        alignItems: 'center',
        marginBottom: 28,
    },
    iconContainer: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#CCFBF1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    input: {
        backgroundColor: '#fff',
    },
    noteBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#ECFEFF',
        borderWidth: 1,
        borderColor: '#A5F3FC',
    },
    noteText: {
        flex: 1,
        color: COLORS.text,
        lineHeight: 20,
    },
    actionButton: {
        marginTop: 4,
    },
    backLink: {
        alignSelf: 'center',
        paddingVertical: 8,
    },
    backLinkText: {
        color: COLORS.primaryDark,
        fontWeight: '700',
    },
});