import { useNavigationStore } from '@/stores/navigation.store';
import { useRouter, useSegments } from 'expo-router';
import { useCallback } from 'react';

const resolveFallbackFromSegments = (segments: string[]) => {
    if (segments.includes('(tabs)')) {
        if (segments.includes('tasks')) return '/(tabs)/tasks';
        if (segments.includes('orders')) return '/(tabs)/orders';
        if (segments.includes('profile')) return '/(tabs)/profile';
        if (segments.includes('warehouse')) return '/(tabs)/warehouse';

        return '/(tabs)/tasks';
    }

    if (segments.includes('profile')) {
        return '/profile';
    }

    return '/';
};

export const useAppBack = (fallbackPath?: string) => {
    const router = useRouter();
    const segments = useSegments();
    const previousPath = useNavigationStore((state) => state.previousPath);

    return useCallback(() => {
        // Expo Router's router.canGoBack() is more reliable for global history
        if (router.canGoBack()) {
            router.back();
            return;
        }

        if (previousPath && previousPath !== '/' && previousPath !== '/login') {
            router.push(previousPath as any);
            return;
        }

        // Only use fallback if there is literally no history (e.g. direct deep link)
        const resolvedFallback = fallbackPath || resolveFallbackFromSegments(segments);
        
        // Use push instead of replace to allow going back if the user navigates 
        // deeper from the fallback screen
        router.push(resolvedFallback as any);
    }, [fallbackPath, previousPath, router, segments]);
};
