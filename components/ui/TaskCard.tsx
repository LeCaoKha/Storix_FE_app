import { COLORS } from '@/constants/color';
import { Task, TaskStatus } from '@/types/order';
import { useTranslation } from '@/hooks/useTranslation';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
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
  const { t } = useTranslation();

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return COLORS.success;
      case TaskStatus.IN_PROGRESS: return COLORS.primary;
      case TaskStatus.PENDING: return COLORS.warning;
      case TaskStatus.CANCELLED: return COLORS.slate500;
      default: return COLORS.slate500;
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return t('tasks.completed');
      case TaskStatus.IN_PROGRESS: return t('tasks.inProgress');
      case TaskStatus.PENDING: return t('tasks.pending');
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'inbound': return t('tasks.inbound');
      case 'outbound': return t('tasks.outbound');
      case 'inventory_count':
      case 'count': 
        return t('tasks.inventoryCount');
      case 'transfer': return t('tasks.transfer');
      default: return type;
    }
  };

  // Attempt to localize title and description if they match English patterns
  const localizedContent = useMemo(() => {
    let title = task.title;
    let description = task.description;

    // Localize Title
    if (title.startsWith('Inbound:')) {
      title = title.replace('Inbound:', `${t('tasks.inbound')}:`);
    } else if (title.startsWith('Outbound:')) {
      title = title.replace('Outbound:', `${t('tasks.outbound')}:`);
    } else if (title.startsWith('Inventory Count:')) {
      title = title.replace('Inventory Count:', `${t('tasks.inventoryCount')}:`);
    }

    // Localize Description
    // Receive goods from SUPPLIER with COUNT items
    const receiveMatch = description.match(/Receive goods from (.*) with (\d+) items/);
    if (receiveMatch) {
      description = t('tasks.receiveDesc', { supplier: receiveMatch[1], count: receiveMatch[2] });
    }

    // Pick items to deliver to DESTINATION with COUNT items
    const pickMatch = description.match(/Pick items to deliver to (.*) with (\d+) items/);
    if (pickMatch) {
      description = t('tasks.pickDesc', { destination: pickMatch[1], count: pickMatch[2] });
    }

    // Count COUNT items in the inventory count ticket
    const countMatch = description.match(/Count (\d+) items in the inventory count ticket/);
    if (countMatch) {
      description = t('tasks.countDesc', { count: countMatch[1] });
    }

    return { title, description };
  }, [task, t]);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    // Default navigation based on task type
    switch (task.type) {
      case 'inbound':
        router.push({
          pathname: '/(staff-tabs)/tasks/inbound/[id]',
          params: {
            id: String(task.relatedOrderId || task.id),
            from: '/(staff-tabs)/tasks',
          },
        } as any);
        break;
      case 'outbound':
        router.push({
          pathname: '/(staff-tabs)/tasks/outbound/[id]',
          params: {
            id: String(task.relatedOrderId || task.id),
            from: '/(staff-tabs)/tasks',
          },
        } as any);
        break;
      case 'count':
        router.push({
          pathname: '/(staff-tabs)/tasks/count/[id]',
          params: {
            id: String(task.relatedOrderId || task.id),
            from: '/(staff-tabs)/tasks',
          },
        } as any);
        break;
      case 'transfer':
        router.push({
          pathname: '/(staff-tabs)/tasks/transfer/[id]',
          params: {
            id: String(task.relatedOrderId || task.id),
            from: '/(staff-tabs)/tasks',
          },
        } as any);
        break;
      default:
        console.log('No route for task type:', task.type);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{localizedContent.title}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
      </View>

      <Text style={styles.description} numberOfLines={2}>{localizedContent.description}</Text>

      <View style={styles.footer}>
        <View style={styles.typeTag}>
          <Feather name="tag" size={12} color={COLORS.textMuted} />
          <Text style={styles.typeText}>{getTypeLabel(task.type)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '10' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>{getStatusLabel(task.status)}</Text>
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