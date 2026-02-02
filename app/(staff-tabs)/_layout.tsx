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
                    title: "Tasks",
                    tabBarIcon: ({ color }) => <Feather name="clipboard" size={28} color={color} />,
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
