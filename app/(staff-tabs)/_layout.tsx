import { Feather } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from "@/constants/color";
import { useRefreshStore } from "@/stores/refresh.store";

export default function StaffTabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
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
                    title: "Trang chủ",
                    tabBarIcon: ({ color }) => <Feather name="home" size={28} color={color} />,
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
                name="tasks/index"
                options={{
                    title: "Nhiệm vụ",
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
                    title: "Sơ đồ kho",
                    href: null,
                    tabBarIcon: ({ color }) => <Feather name="map" size={28} color={color} />,
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
                    title: "Thông báo",
                    tabBarIcon: ({ color }) => <Feather name="bell" size={28} color={color} />,
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
                    title: "Profile",
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
                name="tasks/putaway/[id]"
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
