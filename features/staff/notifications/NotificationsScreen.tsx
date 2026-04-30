import { Card, RefreshContainer, SafeAreaHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useTranslation } from '@/hooks/useTranslation';
import { deleteNotification, getUserNotifications, markNotificationAsRead, type NotificationItem } from '@/services/notification.api';
import { useAuthStore } from '@/stores/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Notification {
  id: number;
  type: 'inbound' | 'outbound' | 'inventory' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  date: string;
  referenceId?: number;
  referenceType?: string;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { t, language } = useTranslation();

  const mapNotification = (item: NotificationItem): Notification => {
    const source = item.notification ?? item;
    const createdAtValue = item.createdAt || source.createdAt;
    const createdAt = createdAtValue ? new Date(createdAtValue) : new Date();
    const normalizedType = String(item.type || source.type || '').toLowerCase();
    
    let title = item.title || source.title || t('notifications.defaultTitle');
    let message = item.message || source.message || '';

    // Localize dynamic content
    if (title === 'New outbound ticket assigned') {
      title = t('notifications.newOutboundTitle');
      const idMatch = message.match(/#(\d+)/);
      if (idMatch) message = t('notifications.newOutboundMsg', { id: idMatch[1] });
    } else if (title === 'New inbound ticket assigned') {
      title = t('notifications.newInboundTitle');
      const idMatch = message.match(/#(\d+)/);
      if (idMatch) message = t('notifications.newInboundMsg', { id: idMatch[1] });
    } else if (title === 'New inventory count assigned') {
      title = t('notifications.newCountTitle');
      const idMatch = message.match(/#(\d+)/);
      if (idMatch) message = t('notifications.newCountMsg', { id: idMatch[1] });
    }

    return {
      id: Number(item.id),
      type: normalizedType === 'outbound' ? 'outbound' : normalizedType === 'inventory' ? 'inventory' : normalizedType === 'system' ? 'system' : 'inbound',
      title,
      message,
      time: createdAt.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      isRead: !!(item.isRead ?? source.isRead),
      date: createdAt.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US'),
      referenceId: item.referenceId || source.referenceId,
      referenceType: item.referenceType || source.referenceType,
    };
  };

  const { data: notifications = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notifications', user?.id, language],
    queryFn: async () => {
      if (!user?.id) return [] as Notification[];
      const items = await getUserNotifications(user.id);
      return items.map(mapNotification);
    },
    enabled: !!user?.id,
    staleTime: 0,
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: number) => markNotificationAsRead(user?.id ?? 0, notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId: number) => deleteNotification(user?.id ?? 0, notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((notification) => !notification.isRead);
    if (unread.length === 0) return;
    
    // Use mutateAsync but don't wait for internal invalidations on every step
    await Promise.all(unread.map((notification) => markReadMutation.mutateAsync(notification.id)));
    
    // Invalidate once at the end
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;
    try {
      await Promise.all(notifications.map((notification) => deleteMutation.mutateAsync(notification.id)));
      // Invalidate once at the end
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      console.error(err);
    }
  };

  const errorMessage = error instanceof Error ? error.message : t('common.failed');

  const getCategoryTheme = (type: Notification['type']) => {
    switch (type) {
      case 'inbound': return { label: t('tasks.inbound'), color: COLORS.primary };
      case 'outbound': return { label: t('tasks.outbound'), color: COLORS.warning };
      case 'inventory': return { label: t('tasks.inventoryCount'), color: COLORS.success };
      case 'system': return { label: t('profile.role'), color: COLORS.info }; // Placeholder for system
      default: return { label: t('tabs.notifications'), color: COLORS.slate500 };
    }
  };

  const handleNotificationPress = (item: Notification) => {
    // Mark as read if not already
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }

    // Navigate based on referenceType and id
    if (!item.referenceId) return;

    const id = item.referenceId;
    const isStaff = user?.roleId === 4;

    switch (item.referenceType) {
      case 'InboundOrder':
        if (isStaff) {
          router.push(`/(staff-tabs)/tasks/inbound/${id}`);
        } else {
          router.push(`/(manager-tabs)/(orders-inbound)/${id}`);
        }
        break;
      case 'OutboundOrder':
        if (isStaff) {
          router.push(`/(staff-tabs)/tasks/outbound/${id}`);
        } else {
          router.push(`/(manager-tabs)/(orders-outbound)/${id}`);
        }
        break;
      case 'StockCountTicket':
        // Primary route for stock count is in staff app
        router.push(`/(staff-tabs)/tasks/count/${id}`);
        break;
      case 'InboundRequest':
        // Requests are for managers
        router.push(`/(manager-tabs)/requisitions/${id}`);
        break;
      default:
        console.log('[Notification] No navigation route for type:', item.referenceType);
    }
  };

  const renderItem = (item: Notification) => {
    const theme = getCategoryTheme(item.type);
    return (
      <TouchableOpacity 
        key={item.id} 
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <Card style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.titleWrapper}>
              {!item.isRead && <View style={styles.unreadIndicator} />}
              <Text style={[styles.title, !item.isRead && styles.unreadText]} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.timeText}>{item.time}</Text>
              <TouchableOpacity 
                onPress={() => deleteMutation.mutate(item.id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.messageText} numberOfLines={3}>
            {item.message}
          </Text>

          <View style={styles.cardFooter}>
            <View style={[styles.typeBadge, { backgroundColor: theme.color + '10' }]}>
              <View style={[styles.typeDot, { backgroundColor: theme.color }]} />
              <Text style={[styles.typeText, { color: theme.color }]}>{theme.label}</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Group notifications by date
  const sections = useMemo(() => notifications.reduce((acc, curr) => {
    const section = acc.find(s => s.title === curr.date);
    if (section) {
      section.data.push(curr);
    } else {
      acc.push({ title: curr.date, data: [curr] });
    }
    return acc;
  }, [] as { title: string, data: Notification[] }[]), [notifications]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingState]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.emptyTitle}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaHeader backgroundColor="#fff" showBackButton={false} style={styles.header}>
        <Text style={styles.titleHeader}>{t('notifications.title')}</Text>
      </SafeAreaHeader>
      
      <RefreshContainer 
        style={styles.container} 
        onRefresh={handleRefresh}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.actionHeader}>
          <Text style={styles.totalText}>
            {t('notifications.newCount', { count: notifications.filter(n => !n.isRead).length })}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={styles.markReadText}>{t('notifications.markAllRead')}</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity onPress={clearAllNotifications}>
              <Text style={styles.clearAllText}>{t('notifications.deleteAll')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isError && (
          <View style={styles.errorState}>
            <Text style={styles.emptyTitle}>{t('common.error')}</Text>
            <Text style={styles.emptySubtitle}>{errorMessage}</Text>
          </View>
        )}

        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.data.map(item => renderItem(item))}
          </View>
        ))}

        {!isError && notifications.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('notifications.noNotifications')}</Text>
            <Text style={styles.emptySubtitle}>{t('notifications.noNotificationsDesc')}</Text>
          </View>
        )}
      </RefreshContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: 16,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleHeader: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  markReadText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    paddingLeft: 4,
  },
  notificationCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadCard: {
    borderColor: COLORS.primary + '30',
    backgroundColor: '#FFFFFF', // Clean white even if unread, indicator handles it
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  unreadText: {
    color: COLORS.primary,
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginLeft: 12,
  },
  messageText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  loadingState: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 6,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#E2E8F0',
  },
  clearAllText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
});
