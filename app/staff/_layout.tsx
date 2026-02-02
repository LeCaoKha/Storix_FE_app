import { Stack } from 'expo-router';
import React from 'react';

export default function StaffLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="inbound/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="outbound/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="putaway/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="count/[id]" options={{ headerShown: false }} />
        </Stack>
    );
}
