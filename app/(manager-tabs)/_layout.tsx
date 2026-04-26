import { COLORS } from '@/constants/color';
import { useAuthStore } from '@/stores/auth.store';
import { useRefreshStore } from "@/stores/refresh.store";
import { Feather } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function ManagerTabLayout() {
    const roleId = useAuthStore((state) => state.user?.roleId);
    const canAccessTransfers = roleId === 2 || roleId === 3 || roleId === 4;
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
                },
            }}
        >
            <Tabs.Screen
                name="requisitions"
                options={{
                    href: '/(manager-tabs)/requisitions',
                    title: "Đề Xuất",
                    tabBarIcon: ({ color }) => <Feather name="file-text" size={24} color={color} />,
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
                name="inventory-count"
                options={{
                    href: '/(manager-tabs)/inventory-count',
                    title: "Kiểm kê",
                    tabBarIcon: ({ color }) => <Feather name="clipboard" size={24} color={color} />,
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
                name="transfers/index"
                options={{
                    href: canAccessTransfers ? '/(manager-tabs)/transfers' : null,
                    title: "Luân Chuyển",
                    tabBarIcon: ({ color }) => <Feather name="repeat" size={24} color={color} />,
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
                name="orders"
                options={{
                    href: '/(manager-tabs)/orders',
                    title: "Đơn hàng",
                    tabBarIcon: ({ color }) => <Feather name="package" size={24} color={color} />,
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
                    href: '/(manager-tabs)/profile',
                    title: "Hồ sơ",
                    tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
                }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        if (navigation.isFocused()) {
                            useRefreshStore.getState().triggerRefresh();
                        }
                    },
                })}
            />

            {/* Hidden routes */}
            <Tabs.Screen
                name="index"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
            <Tabs.Screen
                name="warehouse"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
            <Tabs.Screen
                name="notifications"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
            <Tabs.Screen
                name="inventory-count/[id]"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
            <Tabs.Screen
                name="inventory-count/create"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
            <Tabs.Screen
                name="transfers/[id]"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
            <Tabs.Screen
                name="transfers/create"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
             <Tabs.Screen
                name="requisitions/[id]"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
            <Tabs.Screen
                name="requisitions/create"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
            <Tabs.Screen
                name="(orders-inbound)"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
             <Tabs.Screen
                name="(orders-inbound)/[id]"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
             <Tabs.Screen
                name="(orders-inbound)/create"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
             <Tabs.Screen
                name="(orders-outbound)"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
             <Tabs.Screen
                name="(orders-outbound)/[id]"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
             <Tabs.Screen
                name="(orders-outbound)/create"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
            <Tabs.Screen
                name="transfers/warehouse"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
            <Tabs.Screen
                name="requisitions/warehouse"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
            <Tabs.Screen
                name="orders/warehouse"
                options={{ href: null, tabBarStyle: { display: 'none' } }}
            />
        </Tabs>
    );
}
