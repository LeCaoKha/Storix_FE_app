import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Tabs } from "expo-router";
import React from "react";
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from "@/constants/color";
import { useTranslation } from "@/hooks/useTranslation";
import { getUserNotifications } from "@/services/notification.api";
import { useAuthStore } from "@/stores/auth.store";
import { useRefreshStore } from "@/stores/refresh.store";

function NotificationTabIcon({ color }: { color: string }) {
    const userId = useAuthStore((state) => state.user?.id ?? 0);

    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['notifications', 'badge', userId],
        queryFn: async () => {
            if (!userId) return 0;
            const items = await getUserNotifications(userId);
            return items.filter((item) => !(item.isRead ?? item.notification?.isRead)).length;
        },
        enabled: !!userId,
        staleTime: 0,
    });

    return (
        <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="bell" size={28} color={color} />
            {unreadCount > 0 && (
                <View style={{ position: 'absolute', top: 0, right: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
            )}
        </View>
    );
}

export default function StaffTabLayout() {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    return (
        <Tabs
            initialRouteName="tasks/index"
            screenOptions={{
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: COLORS.border,
                    paddingTop: 8,
                    paddingBottom: 8 + insets.bottom,
                    height: 64 + insets.bottom,
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="tasks/index"
                options={{
                    title: t('tabs.tasks'),
                    tabBarIcon: ({ color }) => <Feather name="clipboard" size={28} color={color} />,
                }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        if (navigation.isFocused()) {
                            useRefreshStore.getState().triggerRefresh();
                        }
                    },
                })}
            />
            <Tabs.Screen
                name="warehouse"
                options={{
                    title: t('tabs.map'),
                    href: null,
                    tabBarIcon: ({ color }) => <Feather name="map" size={28} color={color} />,
                    tabBarStyle: { display: 'none' },
                }}
            />
            {/* Hide nested warehouse from tab bar but keep it in stack */}
            <Tabs.Screen
                name="tasks/warehouse"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="orders/[id]"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: t('tabs.notifications'),
                    tabBarIcon: ({ color }) => <NotificationTabIcon color={color} />,
                }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        if (navigation.isFocused()) {
                            useRefreshStore.getState().triggerRefresh();
                        }
                    },
                })}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('tabs.profile'),
                    tabBarIcon: ({ color }) => <Feather name="user" size={28} color={color} />,
                }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        if (navigation.isFocused()) {
                            useRefreshStore.getState().triggerRefresh();
                        }
                    },
                })}
            />
            {/* Hide nested task routes from tab bar */}
            <Tabs.Screen
                name="tasks/count/[id]"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="tasks/inbound/[id]"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="tasks/outbound/[id]"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="tasks/transfer/[id]"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="tasks/transfer/receive/[id]"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tabs.Screen
                name="tasks/transfer/quality/[id]"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' },
                }}
            />
        </Tabs>
    );
}
