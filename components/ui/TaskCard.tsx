import { COLORS } from '@/constants/color';
import { Task, TaskPriority, TaskStatus } from '@/types/order';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
}) => {
  const router = useRouter();

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW: return COLORS.success;
      case TaskPriority.MEDIUM: return COLORS.warning;
      case TaskPriority.HIGH: return COLORS.danger;
      case TaskPriority.URGENT: return '#7C3AED'; // Deep Purple
      default: return COLORS.slate500;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return COLORS.success;
      case TaskStatus.IN_PROGRESS: return COLORS.primary;
      case TaskStatus.PENDING: return COLORS.warning;
      case TaskStatus.CANCELLED: return COLORS.slate500;
      default: return COLORS.slate500;
    }
  };



  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    // Default navigation based on task type
    switch (task.type) {
      case 'inbound':
        router.push(`/(staff-tabs)/tasks/inbound/${task.relatedOrderId || task.id}` as any);
        break;
      case 'outbound':
        router.push(`/(staff-tabs)/tasks/outbound/${task.relatedOrderId || task.id}` as any);
        break;
      case 'putaway':
        router.push(`/(staff-tabs)/tasks/putaway/${task.relatedOrderId || task.id}` as any);
        break;
      case 'count':
        router.push(`/(staff-tabs)/tasks/count/${task.id}` as any);
        break;
      case 'transfer':
        router.push(`/(staff-tabs)/tasks/transfer/${task.relatedOrderId || task.id}` as any);
        break;
      default:
        console.log('No route for task type:', task.type);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{task.title}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
      </View>

      <Text style={styles.description} numberOfLines={2}>{task.description}</Text>

      <View style={styles.footer}>
        <View style={styles.typeTag}>
          <Feather name="tag" size={12} color={COLORS.textMuted} />
          <Text style={styles.typeText}>{task.type}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '10' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>{task.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    maxWidth: '70%',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});