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
    const router = useRouter();
    const segments = useSegments();

    return useCallback(() => {
        // Expo Router's router.canGoBack() is more reliable for global history
        if (router.canGoBack()) {
            router.back();
            return;
        }

        // Only use fallback if there is literally no history (e.g. direct deep link)
        const resolvedFallback = fallbackPath || resolveFallbackFromSegments(segments);
        
        // Use push instead of replace to allow going back if the user navigates 
        // deeper from the fallback screen
        router.push(resolvedFallback as any);
    }, [fallbackPath, router, segments]);
};