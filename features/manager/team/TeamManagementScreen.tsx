import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants/color';

export default function TeamManagementScreen() {
    const staffMembers = [
        {
            id: '1',
            name: 'Nguyen Van A',
            role: 'Warehouse Staff',
            tasksCompleted: 45,
            efficiency: 95,
            status: 'active',
        },
        {
            id: '2',
            name: 'Tran Thi B',
            role: 'Warehouse Staff',
            tasksCompleted: 38,
            efficiency: 92,
            status: 'active',
        },
        {
            id: '3',
            name: 'Le Van C',
            role: 'Warehouse Staff',
            tasksCompleted: 52,
            efficiency: 88,
            status: 'busy',
        },
        {
            id: '4',
            name: 'Pham Thi D',
            role: 'Warehouse Staff',
            tasksCompleted: 41,
            efficiency: 90,
            status: 'active',
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#10B981';
            case 'busy': return '#F59E0B';
            case 'offline': return '#EF4444';
            default: return COLORS.textMuted;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Available';
            case 'busy': return 'Busy';
            case 'offline': return 'Offline';
            default: return 'Unknown';
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Team Management</Text>
                <Text style={styles.subtitle}>Staff Overview & Performance</Text>
            </View>

            <View style={styles.content}>
                {/* Team Stats */}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{staffMembers.length}</Text>
                        <Text style={styles.statLabel}>Total Staff</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{staffMembers.filter(s => s.status === 'active').length}</Text>
                        <Text style={styles.statLabel}>Available</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>91%</Text>
                        <Text style={styles.statLabel}>Avg. Efficiency</Text>
                    </Card>
                </View>

                {/* Staff List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Staff Members</Text>
                    {staffMembers.map((staff) => (
                        <Card key={staff.id} style={styles.staffCard}>
                            <View style={styles.staffHeader}>
                                <View style={styles.staffAvatar}>
                                    <Feather name="user" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.staffInfo}>
                                    <Text style={styles.staffName}>{staff.name}</Text>
                                    <Text style={styles.staffRole}>{staff.role}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(staff.status) + '20' }]}>
                                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(staff.status) }]} />
                                    <Text style={[styles.statusText, { color: getStatusColor(staff.status) }]}>
                                        {getStatusLabel(staff.status)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.staffStats}>
                                <View style={styles.staffStatItem}>
                                    <Feather name="check-circle" size={16} color={COLORS.textMuted} />
                                    <Text style={styles.staffStatText}>{staff.tasksCompleted} tasks</Text>
                                </View>
                                <View style={styles.staffStatItem}>
                                    <Feather name="trending-up" size={16} color={COLORS.textMuted} />
                                    <Text style={styles.staffStatText}>{staff.efficiency}% efficiency</Text>
                                </View>
                            </View>
                        </Card>
                    ))}
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
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    staffCard: {
        padding: 16,
    },
    staffHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    staffAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#CCFBF1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    staffInfo: {
        flex: 1,
    },
    staffName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    staffRole: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    staffStats: {
        flexDirection: 'row',
        gap: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    staffStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    staffStatText: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
});
