import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants/color';

export default function AnalyticsScreen() {
    const metrics = [
        { label: 'Orders This Week', value: '127', change: '+12%', isPositive: true },
        { label: 'Avg. Processing Time', value: '2.4h', change: '-8%', isPositive: true },
        { label: 'Staff Efficiency', value: '92%', change: '+5%', isPositive: true },
        { label: 'Inventory Accuracy', value: '98%', change: '+2%', isPositive: true },
    ];

    const reports = [
        { title: 'Weekly Performance Report', date: '01/27/2026 - 02/02/2026', icon: 'file-text' },
        { title: 'Monthly Inventory Summary', date: 'January 2026', icon: 'package' },
        { title: 'Staff Productivity Analysis', date: 'Q4 2025', icon: 'users' },
        { title: 'Order Fulfillment Trends', date: 'Last 30 days', icon: 'trending-up' },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Analytics</Text>
                <Text style={styles.subtitle}>Performance & Reports</Text>
            </View>

            <View style={styles.content}>
                {/* Key Metrics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Metrics</Text>
                    <View style={styles.metricsGrid}>
                        {metrics.map((metric, index) => (
                            <Card key={index} style={styles.metricCard}>
                                <Text style={styles.metricLabel}>{metric.label}</Text>
                                <Text style={styles.metricValue}>{metric.value}</Text>
                                <View style={styles.metricChange}>
                                    <Feather
                                        name={metric.isPositive ? 'trending-up' : 'trending-down'}
                                        size={14}
                                        color={metric.isPositive ? '#10B981' : '#EF4444'}
                                    />
                                    <Text
                                        style={[
                                            styles.metricChangeText,
                                            { color: metric.isPositive ? '#10B981' : '#EF4444' }
                                        ]}
                                    >
                                        {metric.change}
                                    </Text>
                                </View>
                            </Card>
                        ))}
                    </View>
                </View>

                {/* Chart Placeholder */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Trends</Text>
                    <Card style={styles.chartCard}>
                        <View style={styles.chartPlaceholder}>
                            <Feather name="bar-chart-2" size={48} color={COLORS.textMuted} />
                            <Text style={styles.chartPlaceholderText}>Chart visualization coming soon</Text>
                        </View>
                    </Card>
                </View>

                {/* Reports */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Reports</Text>
                    <Card>
                        {reports.map((report, index) => (
                            <View key={index}>
                                <View style={styles.reportItem}>
                                    <View style={styles.reportIcon}>
                                        <Feather name={report.icon as any} size={20} color={COLORS.primary} />
                                    </View>
                                    <View style={styles.reportContent}>
                                        <Text style={styles.reportTitle}>{report.title}</Text>
                                        <Text style={styles.reportDate}>{report.date}</Text>
                                    </View>
                                    <Feather name="download" size={20} color={COLORS.textMuted} />
                                </View>
                                {index < reports.length - 1 && <View style={styles.divider} />}
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    metricCard: {
        flex: 1,
        minWidth: '47%',
        padding: 16,
    },
    metricLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 8,
    },
    metricValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 6,
    },
    metricChange: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metricChangeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    chartCard: {
        padding: 32,
    },
    chartPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    chartPlaceholderText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textMuted,
    },
    reportItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    reportIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#CCFBF1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reportContent: {
        flex: 1,
    },
    reportTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    reportDate: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 12,
    },
});
