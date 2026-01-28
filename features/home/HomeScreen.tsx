import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants/color';

export default function HomeScreen() {
    const router = useRouter();

    // Data from web app
    const todayTasks = [
        { id: 1, type: "Picking", location: "Zone A - Shelf 5", items: 15, status: "In Progress", efficiency: "94%" },
        { id: 2, type: "Putaway", location: "Zone B - Bin 12", items: 8, status: "Pending", efficiency: "-" },
        { id: 3, type: "Counting", location: "Zone C", items: 45, status: "Completed", efficiency: "100%" },
    ];

    const navigateTo = (screen: string) => {
        // Placeholder for navigation - routes not yet implemented
        console.log(`Navigating to ${screen}`);
        // router.push(screen); 
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello, Staff</Text>
                <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today's Tasks</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {todayTasks.map((task) => (
                        <Card key={task.id} style={styles.taskCard}>
                            <View style={styles.taskHeader}>
                                <View>
                                    <Text style={styles.taskType}>{task.type}</Text>
                                    <Text style={styles.taskLocation}>{task.location}</Text>
                                </View>
                                {task.status === "In Progress" && <Feather name="clock" size={20} color="#eab308" />}
                                {task.status === "Completed" && <Feather name="check-circle" size={20} color="#22c55e" />}
                                {task.status === "Pending" && <Feather name="alert-circle" size={20} color={COLORS.textMuted} />}
                            </View>

                            <View style={styles.taskStats}>
                                <Text style={styles.taskItems}>Items: {task.items}</Text>
                                {task.efficiency !== "-" && <Text style={styles.taskEfficiency}>{task.efficiency}</Text>}
                            </View>

                            <View style={styles.taskFooter}>
                                <Text style={styles.taskStatus}>{task.status}</Text>
                            </View>

                            {task.status === "In Progress" && (
                                <TouchableOpacity style={styles.actionButton} onPress={() => navigateTo('Routes')}>
                                    <Feather name="navigation" size={16} color="#fff" />
                                    <Text style={styles.actionButtonText}>View Route</Text>
                                </TouchableOpacity>
                            )}
                        </Card>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.section}>
                <TouchableOpacity onPress={() => navigateTo('Routes')}>
                    <Card style={styles.routeCard}>
                        <View style={styles.routeHeader}>
                            <View style={styles.iconBox}>
                                <Feather name="navigation" size={24} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.routeTitle}>AI-Optimized Route</Text>
                                <Text style={styles.routeSubtitle}>55m | 8 mins</Text>
                            </View>
                        </View>
                        <Text style={styles.routeAction}>Tap to start picking</Text>
                    </Card>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <View style={styles.grid}>
                    <TouchableOpacity style={styles.gridItem} onPress={() => navigateTo('Performance')}>
                        <Card style={styles.gridCard}>
                            <Feather name="trending-up" size={24} color={COLORS.primary} />
                            <Text style={styles.gridLabel}>Performance</Text>
                            <Text style={styles.gridValue}>94%</Text>
                        </Card>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={() => navigateTo('AISuggestions')}>
                        <Card style={styles.gridCard}>
                            <MaterialCommunityIcons name="brain" size={24} color={COLORS.secondary} />
                            <Text style={styles.gridLabel}>AI Tips</Text>
                            <Text style={styles.gridValue}>3 New</Text>
                        </Card>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={() => navigateTo('Tasks')}>
                        <Card style={styles.gridCard}>
                            <Feather name="package" size={24} color="#22c55e" />
                            <Text style={styles.gridLabel}>Total Items</Text>
                            <Text style={styles.gridValue}>68</Text>
                        </Card>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ height: 20 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        paddingTop: 60, // Safe area roughly
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    date: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    section: {
        padding: 20,
        paddingBottom: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: COLORS.text,
    },
    horizontalScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    taskCard: {
        width: 280,
        marginRight: 15,
        marginBottom: 10,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    taskType: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    taskLocation: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    taskStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f3f4f6',
        padding: 8,
        borderRadius: 6,
        marginBottom: 10,
    },
    taskItems: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    taskEfficiency: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    taskFooter: {
        marginBottom: 10,
    },
    taskStatus: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textMuted,
    },
    actionButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        gap: 6,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    routeCard: {
        backgroundColor: COLORS.primary,
        borderWidth: 0,
    },
    routeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    routeTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    routeSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    routeAction: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        borderRadius: 6,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: '31%',
    },
    gridCard: {
        alignItems: 'center',
        padding: 15,
    },
    gridLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 8,
        marginBottom: 4,
    },
    gridValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
});
