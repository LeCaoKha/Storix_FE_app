import { useNavigation } from '@react-navigation/native';
import { useRouter, useSegments } from 'expo-router';
import { useCallback } from 'react';

const resolveFallbackFromSegments = (segments: string[]) => {
    if (segments.includes('(manager-tabs)')) {
        if (segments.includes('transfers')) return '/(manager-tabs)/transfers';
        if (segments.includes('requisitions')) return '/(manager-tabs)/requisitions';
        if (segments.includes('(orders-inbound)') || segments.includes('(orders-outbound)') || segments.includes('orders')) {
            return '/(manager-tabs)/orders';
        }
        if (segments.includes('profile')) return '/(manager-tabs)/profile';

        return '/(manager-tabs)/requisitions';
    }

    if (segments.includes('(staff-tabs)')) {
        if (segments.includes('tasks')) return '/(staff-tabs)/tasks';
        if (segments.includes('orders')) return '/(staff-tabs)/tasks';
        if (segments.includes('profile')) return '/(staff-tabs)/profile';
        if (segments.includes('warehouse')) return '/(staff-tabs)/warehouse';

        return '/(staff-tabs)/tasks';
    }

    if (segments.includes('profile')) {
        return '/profile';
    }

    return '/';
};

export const useAppBack = (fallbackPath?: string) => {
    const navigation = useNavigation();
    const router = useRouter();
    const segments = useSegments();

    return useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
            return;
        }

        router.replace((fallbackPath || resolveFallbackFromSegments(segments)) as any);
    }, [fallbackPath, navigation, router, segments]);
};