import { COLORS } from '@/constants/color';
import InboundOrdersScreen from '@/features/manager/orders/InboundOrdersScreen';
import OutboundOrdersScreen from '@/features/manager/orders/OutboundOrdersScreen';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrdersScreen() {
    const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');

    return (
        <View style={styles.container}>
            {/* Tab Header */}
            <View style={styles.tabHeader}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'inbound' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('inbound')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'inbound' && styles.tabButtonTextActive]}>
                        Đơn Nhập Kho
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'outbound' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('outbound')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'outbound' && styles.tabButtonTextActive]}>
                        Đơn Xuất Kho
                    </Text>
                </TouchableOpacity>
            </View>

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
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
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
