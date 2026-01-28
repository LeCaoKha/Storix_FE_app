import { Tabs } from "expo-router";
import React from "react";
import { MaterialIcons, Feather } from '@expo/vector-icons';


import { useColorScheme } from "@/hooks/use-color-scheme";
import { COLORS } from "@/constants/color";

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
          title: "Home",
          tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "My Tasks",
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
