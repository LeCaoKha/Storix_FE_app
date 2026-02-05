import { COLORS } from '@/constants/color';
import { Feather } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import React from "react";


export default function ManagerTabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: COLORS.border,
                },
            }}
        >
            {/* Show only these 3 tabs */}
            <Tabs.Screen
                name="requisitions"
                options={{
                    href: '/(manager-tabs)/requisitions', // Show this tab
                    title: "Đề Xuất",
                    tabBarIcon: ({ color }) => <Feather name="file-text" size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    href: '/(manager-tabs)/orders', // Show this tab
                    title: "Orders",
                    tabBarIcon: ({ color }) => <Feather name="package" size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    href: '/(manager-tabs)/profile', // Show this tab
                    title: "Profile",
                    tabBarIcon: ({ color }) => <Feather name="user" size={28} color={color} />,
                }}
            />

            {/* Hide all other routes from tab bar */}
            <Tabs.Screen name="index" options={{ href: null }} />
            <Tabs.Screen name="(orders-inbound)" options={{ href: null }} />
            <Tabs.Screen name="(orders-inbound)/[id]" options={{ href: null }} />
            <Tabs.Screen name="(orders-inbound)/create" options={{ href: null }} />
            <Tabs.Screen name="(orders-outbound)" options={{ href: null }} />
            <Tabs.Screen name="(orders-outbound)/[id]" options={{ href: null }} />
            <Tabs.Screen name="(orders-outbound)/create" options={{ href: null }} />
            <Tabs.Screen name="requisitions/[id]" options={{ href: null }} />
            <Tabs.Screen name="requisitions/create" options={{ href: null }} />
        </Tabs>
    );
}
