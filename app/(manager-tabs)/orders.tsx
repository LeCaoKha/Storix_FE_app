import { SafeAreaHeader } from '@/components';
import { COLORS } from '@/constants/color';
import InboundOrdersScreen from '@/features/manager/orders/InboundOrdersScreen';
import OutboundOrdersScreen from '@/features/manager/orders/OutboundOrdersScreen';
import InventoryManagementScreen from '@/features/manager/inventory/InventoryManagementScreen';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrdersScreen() {
    const [activeTab, setActiveTab] = useState<'inbound' | 'outbound' | 'inventory'>('inbound');

    return (
        <View style={styles.container}>
            {/* Tab Header with SafeArea */}
            <SafeAreaHeader backgroundColor="#fff" showBackButton={false} style={styles.tabHeader}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'inbound' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('inbound')}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'inbound' && styles.tabButtonTextActive]} numberOfLines={1}>
                            Nhập kho
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'outbound' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('outbound')}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'outbound' && styles.tabButtonTextActive]} numberOfLines={1}>
                            Xuất kho
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'inventory' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('inventory')}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'inventory' && styles.tabButtonTextActive]} numberOfLines={1}>
                            Tồn kho
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaHeader>

            {/* Tab Content */}
            {activeTab === 'inbound' && <InboundOrdersScreen />}
            {activeTab === 'outbound' && <OutboundOrdersScreen />}
            {activeTab === 'inventory' && <InventoryManagementScreen />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    tabHeader: {
        paddingBottom: 0,
        paddingHorizontal: 0,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerContent: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: COLORS.primary,
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    tabButtonTextActive: {
        color: COLORS.primary,
    },
});
