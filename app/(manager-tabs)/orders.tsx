import { SafeAreaHeader } from '@/components';
import { COLORS } from '@/constants/color';
import InboundOrdersScreen from '@/features/manager/orders/InboundOrdersScreen';
import OutboundOrdersScreen from '@/features/manager/orders/OutboundOrdersScreen';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrdersScreen() {
    const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');

    return (
        <View style={styles.container}>
            {/* Tab Header with SafeArea */}
            <SafeAreaHeader backgroundColor="#fff" showBackButton={false} style={styles.tabHeader}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'inbound' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('inbound')}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'inbound' && styles.tabButtonTextActive]}>
                            Đơn Nhập Kho
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.tabDivider} />
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'outbound' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('outbound')}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'outbound' && styles.tabButtonTextActive]}>
                            Đơn Xuất Kho
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaHeader>

            {/* Tab Content */}
            {activeTab === 'inbound' ? <InboundOrdersScreen /> : <OutboundOrdersScreen />}
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
        marginHorizontal: -16, // Compensate for SafeAreaHeader's paddingHorizontal: 16
    },
    tabDivider: {
        width: 1,
        backgroundColor: COLORS.border,
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
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    tabButtonTextActive: {
        color: COLORS.primary,
    },
});
