import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants/color';

export default function DashboardScreen() {
    const stats = [
        { label: 'Active Orders', value: '48', icon: 'package', color: '#3B82F6', bgColor: '#DBEAFE' },
        { label: 'Total Staff', value: '23', icon: 'users', color: '#10B981', bgColor: '#D1FAE5' },
        { label: 'Inventory Items', value: '1,247', icon: 'database', color: '#F59E0B', bgColor: '#FEF3C7' },
        { label: 'Efficiency', value: '94%', icon: 'trending-up', color: '#8B5CF6', bgColor: '#EDE9FE' },
    ];

    const recentActivities = [
        { id: '1', action: 'Order OUT-2026-001 completed', time: '5 min ago', icon: 'check-circle', color: '#10B981' },
        { id: '2', action: 'New staff assigned to WH-01', time: '15 min ago', icon: 'user-plus', color: '#3B82F6' },
        { id: '3', action: 'Inventory count requested', time: '1 hour ago', icon: 'clipboard', color: '#F59E0B' },
        { id: '4', action: 'Alert: Low stock on Item A123', time: '2 hours ago', icon: 'alert-triangle', color: '#EF4444' },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Dashboard</Text>
                <Text style={styles.subtitle}>Warehouse Overview</Text>
            </View>

            <View style={styles.content}>
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <Card key={index} style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: stat.bgColor }]}>
                                <Feather name={stat.icon as any} size={24} color={stat.color} />
                            </View>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </Card>
                    ))}
                </View>

                {/* Recent Activities */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activities</Text>
                    <Card>
                        {recentActivities.map((activity, index) => (
                            <View key={activity.id}>
                                <View style={styles.activityItem}>
                                    <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                                        <Feather name={activity.icon as any} size={18} color={activity.color} />
                                    </View>
                                    <View style={styles.activityContent}>
                                        <Text style={styles.activityAction}>{activity.action}</Text>
                                        <Text style={styles.activityTime}>{activity.time}</Text>
                                    </View>
                                </View>
                                {index < recentActivities.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))}
                    </Card>
                </View>
            </View>

            <View style={{ height: 20 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    content: {
        padding: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        minWidth: '47%',
        alignItems: 'center',
        padding: 20,
    },
    statIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityContent: {
        flex: 1,
    },
    activityAction: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 12,
    },
});
