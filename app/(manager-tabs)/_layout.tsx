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
                name="index"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ color }) => <Feather name="activity" size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: "Analytics",
                    tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="team"
                options={{
                    title: "Team",
                    tabBarIcon: ({ color }) => <Feather name="users" size={28} color={color} />,
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
