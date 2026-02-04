import "@/global.css";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from 'react-native';
import "react-native-reanimated";

import { queryClient } from '@/services/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />

          {/* Staff tabs */}
          <Stack.Screen name="(staff-tabs)" options={{ headerShown: false }} />

          {/* Manager tabs */}
          <Stack.Screen name="(manager-tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
