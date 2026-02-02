import "@/global.css";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider } from "@/contexts/AuthContext";
import { InboundOrderProvider } from "@/contexts/InboundOrderContext";
import { OutboundOrderProvider } from "@/contexts/OutboundOrderContext";
import { RequisitionProvider } from "@/contexts/RequisitionContext";
import { useColorScheme } from "@/hooks/use-color-scheme";



export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <RequisitionProvider>
        <InboundOrderProvider>
          <OutboundOrderProvider>
            <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />

                {/* Staff tabs */}
                <Stack.Screen name="(staff-tabs)" options={{ headerShown: false }} />

                {/* Manager tabs */}
                <Stack.Screen name="(manager-tabs)" options={{ headerShown: false }} />

                {/* Manager screens */}
                <Stack.Screen name="manager" options={{ headerShown: false }} />

                {/* Staff screens */}
                <Stack.Screen name="staff" options={{ headerShown: false }} />

              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </OutboundOrderProvider>
        </InboundOrderProvider>
      </RequisitionProvider>
    </AuthProvider>
  );
}
