import { Feather } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import React from "react";

import { COLORS } from "@/constants/color";

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
                }
            }}
        >
            <Tabs.Screen
                name="requisitions"
                options={{
                    title: "Đề Xuất",
                    tabBarIcon: ({ color }) => <Feather name="file-text" size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: "Orders",
                    tabBarIcon: ({ color }) => <Feather name="package" size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color }) => <Feather name="user" size={28} color={color} />,
                }}
            />
        </Tabs>
    );
}
