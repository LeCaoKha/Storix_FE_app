import "@/global.css";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "react-native-reanimated";

import AlertContainer from "@/components/ui/Alert";
import { queryClient } from '@/services/queryClient';
import { useNavigationStore } from '@/stores/navigation.store';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { registerForPushNotificationsAsync, setupNotificationListeners } from '@/services/notification.service';

function NavigationTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      useNavigationStore.getState().setPath(pathname);
    }
  }, [pathname]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    registerForPushNotificationsAsync();
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <NavigationTracker />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(staff-tabs)" />
              <Stack.Screen name="(manager-tabs)" />
            </Stack>
            <StatusBar style="auto" />
            <AlertContainer />
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
