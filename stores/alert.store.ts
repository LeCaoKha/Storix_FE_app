import { create } from 'zustand';

import { translations } from '@/locales/translations';
import { usePreferencesStore } from '@/stores/preferences.store';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    buttons?: AlertButton[];
    onDismiss?: () => void;

    // Actions
    showAlert: (config: {
        title: string;
        message: string;
        type?: AlertType;
        buttons?: AlertButton[];
        onDismiss?: () => void;
    }) => void;
    hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],

    showAlert: (config) => set({
        visible: true,
        title: config.title,
        message: config.message,
        type: config.type || 'info',
        buttons: config.buttons || [],
        onDismiss: config.onDismiss,
    }),

    hideAlert: () => set({ visible: false }),
}));

/**
 * Tiện ích để gọi Alert từ bất kỳ đâu (ngoài hook)
 */
export const AlertService = {
    show: (config: Parameters<AlertState['showAlert']>[0]) => {
        useAlertStore.getState().showAlert(config);
    },
    hide: () => {
        useAlertStore.getState().hideAlert();
    },
    success: (title: string, message: string, onDismiss?: () => void) => {
        useAlertStore.getState().showAlert({ title, message, type: 'success', onDismiss });
    },
    error: (title: string, message: string, onDismiss?: () => void) => {
        useAlertStore.getState().showAlert({ title, message, type: 'error', onDismiss });
    },
    warning: (title: string, message: string, onDismiss?: () => void) => {
        useAlertStore.getState().showAlert({ title, message, type: 'warning', onDismiss });
    },
    info: (title: string, message: string, onDismiss?: () => void) => {
        useAlertStore.getState().showAlert({ title, message, type: 'info', onDismiss });
    },
    confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
        const language = usePreferencesStore.getState().language;
        const commonTranslations = translations[language]?.common ?? translations.en.common;

        useAlertStore.getState().showAlert({
            title,
            message,
            type: 'confirm',
            buttons: [
                { text: commonTranslations.cancel, onPress: onCancel, style: 'cancel' },
                { text: commonTranslations.confirm, onPress: onConfirm, style: 'default' },
            ],
        });
    },
};
