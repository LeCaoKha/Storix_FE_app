import { Card, ScreenHeader, TaskCard } from '@/components';
import { COLORS } from '@/constants/color';
import { useTasks } from '@/hooks/task.hooks';
import { TaskStatus, TaskType, TaskPriority } from '@/types/order';
import { useAuthStore } from '@/stores/auth.store';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

export default function StaffHomeScreen() {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();
    const { data: tasks = [], isLoading } = useTasks();

    const stats = useMemo(() => {
        const pendingTasks = tasks.filter((t: any) => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS);
        const completedTasks = tasks.filter((t: any) => t.status === TaskStatus.COMPLETED);
        
        // Mocking 'overdue' or 'attention needed' with high priority for now
        const urgentTasks = pendingTasks.filter((t: any) => t.priority === TaskPriority.HIGH || t.priority === TaskPriority.URGENT);
        
        const inboundOps = pendingTasks.filter((t: any) => t.type === TaskType.INBOUND || t.type === TaskType.PUTAWAY).length;
        const outboundOps = pendingTasks.filter((t: any) => t.type === TaskType.OUTBOUND).length;
        const transferOps = pendingTasks.filter((t: any) => t.type === TaskType.TRANSFER).length;

        // Auto-generate alerts based on task data constraints
        const autoAlerts = [];
        if (urgentTasks.length > 0) {
            autoAlerts.push({ id: 1, icon: 'alert-triangle', text: `${urgentTasks.length} nhiệm vụ Ưu tiên cao / Gấp`, color: COLORS.danger });
        }
        if (pendingTasks.length > 15) {
            autoAlerts.push({ id: 2, icon: 'trending-up', text: `Quá tải: ${pendingTasks.length} việc đang chờ xử lý`, color: COLORS.warning });
        }
        if (autoAlerts.length === 0 && pendingTasks.length > 0) {
            autoAlerts.push({ id: 3, icon: 'check-circle', text: 'Vận hành kho đang ổn định', color: COLORS.success });
        }

        return {
            pending: pendingTasks.length,
            completed: completedTasks.length,
            urgent: urgentTasks.length,
            inbound: inboundOps,
            outbound: outboundOps,
            transfer: transferOps,
            alerts: autoAlerts
        };
    }, [tasks]);

    const recentTasks = useMemo(() => {
        return [...tasks]
            .filter((t: any) => t.status !== TaskStatus.COMPLETED)
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 5);
    }, [tasks]);

    return (
        <View style={styles.container}>
            <ScreenHeader
                title={`Xin chào, ${user?.fullName || 'Nhân viên'}`}
                subtitle={`Kho: ${user?.warehouseName || 'Chưa chỉ định'}`}
                showBackButton={false}
            />

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                
                {isLoading ? (
                    <View style={{ flex: 1, padding: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <>
                        {/* 1. TODAY SUMMARY */}
                        <Text style={styles.sectionTitle}>TODAY SUMMARY</Text>
                        <View style={styles.summaryContainer}>
                            <Card style={[styles.summaryCard, { backgroundColor: COLORS.warning + '10', borderColor: COLORS.warning + '30' }]}>
                                <Text style={[styles.summaryValue, { color: COLORS.warning }]}>{stats.pending}</Text>
                                <Text style={styles.summaryLabel}>Pending Tasks</Text>
                            </Card>
                            <Card style={[styles.summaryCard, { backgroundColor: COLORS.danger + '10', borderColor: COLORS.danger + '30' }]}>
                                <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{stats.urgent}</Text>
                                <Text style={styles.summaryLabel}>High Priority</Text>
                            </Card>
                            <Card style={[styles.summaryCard, { backgroundColor: COLORS.success + '10', borderColor: COLORS.success + '30' }]}>
                                <Text style={[styles.summaryValue, { color: COLORS.success }]}>{stats.completed}</Text>
                                <Text style={styles.summaryLabel}>Completed</Text>
                            </Card>
                        </View>

                        {/* 2. OPERATIONS */}
                        <Text style={styles.sectionTitle}>OPERATIONS (PENDING)</Text>
                        <Card style={styles.operationsCard}>
                            <View style={styles.operationItem}>
                                <View style={[styles.opIcon, { backgroundColor: '#EFF6FF' }]}>
                                    <Feather name="download" size={20} color="#3B82F6" />
                                </View>
                                <View style={styles.opTextContainer}>
                                    <Text style={styles.opLabel}>Inbound</Text>
                                    <Text style={styles.opValue}>{stats.inbound}</Text>
                                </View>
                            </View>
                            <View style={styles.opDivider} />
                            
                            <View style={styles.operationItem}>
                                <View style={[styles.opIcon, { backgroundColor: '#FEF2F2' }]}>
                                    <Feather name="upload" size={20} color="#EF4444" />
                                </View>
                                <View style={styles.opTextContainer}>
                                    <Text style={styles.opLabel}>Outbound</Text>
                                    <Text style={styles.opValue}>{stats.outbound}</Text>
                                </View>
                            </View>
                            <View style={styles.opDivider} />
                            
                            <View style={styles.operationItem}>
                                <View style={[styles.opIcon, { backgroundColor: '#F5F3FF' }]}>
                                    <Feather name="repeat" size={20} color="#8B5CF6" />
                                </View>
                                <View style={styles.opTextContainer}>
                                    <Text style={styles.opLabel}>Transfer</Text>
                                    <Text style={styles.opValue}>{stats.transfer}</Text>
                                </View>
                            </View>
                        </Card>

                        {/* 3. ALERTS */}
                        {stats.alerts.length > 0 && (
                            <View style={{ marginBottom: 16 }}>
                                <Text style={styles.sectionTitle}>ALERTS</Text>
                                <View style={styles.alertsContainer}>
                                    {stats.alerts.map(alert => (
                                        <View key={alert.id} style={[styles.alertRow, { borderLeftColor: alert.color }]}>
                                            <View style={[styles.alertIconWrapper, { backgroundColor: alert.color + '15' }]}>
                                                <Feather name={alert.icon as any} size={20} color={alert.color} />
                                            </View>
                                            <Text style={styles.alertText}>{alert.text}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* 4. QUICK ACTIONS */}
                        <Text style={styles.sectionTitle}>QUICK ACTION</Text>
                        <View style={styles.quickActionsContainer}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(staff-tabs)/tasks')}>
                                <Feather name="plus-circle" size={16} color={COLORS.primary} />
                                <Text style={styles.actionBtnText}>Nhập kho</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(staff-tabs)/tasks')}>
                                <Feather name="plus-circle" size={16} color={COLORS.primary} />
                                <Text style={styles.actionBtnText}>Xuất kho</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(staff-tabs)/tasks')}>
                                <Feather name="plus-circle" size={16} color={COLORS.primary} />
                                <Text style={styles.actionBtnText}>Kiểm kê</Text>
                            </TouchableOpacity>
                        </View>

                        {/* 5. MY TASKS */}
                        <View style={styles.myTasksHeader}>
                            <Text style={styles.sectionTitle}>MY TASKS</Text>
                            <TouchableOpacity onPress={() => router.push('/(staff-tabs)/tasks')}>
                                <Text style={styles.seeAllText}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.taskList}>
                            {recentTasks.length > 0 ? (
                                recentTasks.map(task => (
                                    <TaskCard key={task.id} task={task} />
                                ))
                            ) : (
                                <Card style={styles.emptyCard}>
                                    <Feather name="check-circle" size={32} color={COLORS.success} />
                                    <Text style={styles.emptyText}>All caught up!</Text>
                                    <Text style={styles.emptySubText}>No pending tasks right now.</Text>
                                </Card>
                            )}
                        </View>
                    </>
                )}
                
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    content: { flex: 1 },
    contentContainer: { padding: 16 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.textMuted,
        marginTop: 20,
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    // Summary
    summaryContainer: { flexDirection: 'row', gap: 12 },
    summaryCard: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryValue: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
    summaryLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', textTransform: 'uppercase' },
    
    // Operations
    operationsCard: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        padding: 0,
        overflow: 'hidden',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    operationItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12
    },
    opIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    opTextContainer: { flex: 1 },
    opLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    opValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    opDivider: { width: 1, backgroundColor: 'rgba(0,0,0,0.05)' },

    // Alerts
    alertsContainer: { gap: 10 },
    alertRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
    },
    alertIconWrapper: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    alertText: { fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1 },

    // Quick Actions
    quickActionsContainer: { flexDirection: 'row', gap: 10 },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
        gap: 8,
    },
    actionBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.text },

    // Tasks
    myTasksHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 6 },
    seeAllText: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginBottom: 10 },
    taskList: { gap: 0 },
    
    emptyCard: { padding: 32, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
    emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 12, marginBottom: 4 },
    emptySubText: { fontSize: 13, color: COLORS.textMuted },
});
