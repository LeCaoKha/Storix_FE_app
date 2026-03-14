import { Feather } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import React from "react";

import { COLORS } from "@/constants/color";

export default function StaffTabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: COLORS.border,
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Trang chủ",
                    tabBarIcon: ({ color }) => <Feather name="home" size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="tasks/index"
                options={{
                    title: "Nhiệm vụ",
                    tabBarIcon: ({ color }) => <Feather name="clipboard" size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="warehouse"
                options={{
                    title: "Warehouse",
                    tabBarIcon: ({ color }) => <Feather name="map" size={28} color={color} />,
                    href: null,
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
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color }) => <Feather name="user" size={28} color={color} />,
                }}
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
        </Tabs>
    );
}
