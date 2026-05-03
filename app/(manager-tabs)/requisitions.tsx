import { SafeAreaHeader } from '@/components';
import { COLORS } from '@/constants/color';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import InboundRequisitionsScreen from '../../features/manager/requisitions/InboundRequisitionsScreen';
import OutboundRequisitionsScreen from '../../features/manager/requisitions/OutboundRequisitionsScreen';

export default function RequisitionsScreen() {
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
                            Đề Nghị Nhập Kho
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.tabDivider} />
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'outbound' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('outbound')}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'outbound' && styles.tabButtonTextActive]}>
                            Đề Nghị Xuất Kho
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaHeader>

            {/* Tab Content */}
            {activeTab === 'inbound' ? <InboundRequisitionsScreen /> : <OutboundRequisitionsScreen />}
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
