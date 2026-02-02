import { Stack } from 'expo-router';
import React from 'react';

export default function ManagerLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="requisitions/[id]"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="requisitions/create"
                options={{ headerShown: false }}
            />
        </Stack>
    );
}
