import { Card, RefreshContainer, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useStockCountTicket, useUpdateStockCountItem } from '@/hooks/stock-count.hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { useTranslation } from '@/hooks/useTranslation';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import type { StockCountItem } from '@/types/stock-count';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InventoryCountDetailScreen() {
    const router = useRouter();
    const goBack = useAppBack();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const ticketId = parseInt(id || '0');
    const user = useAuthStore((state) => state.user);
    const { t } = useTranslation();
    const companyId = user?.companyId ?? 0;
    const isStaff = user?.roleId === 4;

    const { data: ticket, isLoading, error, refetch } = useStockCountTicket(ticketId, companyId);
    const updateItem = useUpdateStockCountItem();

    const [editingItems, setEditingItems] = useState<Record<number, boolean>>({});
    const [localCounts, setLocalCounts] = useState<Record<number, string>>({});


    const handleEditItem = (itemId: number) => {
        const item = ticket?.items.find(i => i.id === itemId);
        if (item) {
            setLocalCounts(prev => ({ ...prev, [itemId]: item.countedQuantity?.toString() || '' }));
        }
        setEditingItems(prev => ({ ...prev, [itemId]: true }));
    };

    const handleConfirmCount = async (item: StockCountItem) => {
        const countStr = localCounts[item.id];
        if (countStr === undefined || countStr.trim() === '') {
            AlertService.warning(t('common.error'), t('inventoryCount.enterQty'));
            return;
        }

        const count = parseFloat(countStr);
        if (isNaN(count)) {
            AlertService.warning(t('common.error'), t('common.failed'));
            return;
        }

        try {
            await updateItem.mutateAsync({
                ticketId,
                itemId: item.id,
                payload: {
                    countedQuantity: count,
                    productId: item.productId,
                    locationId: item.locationId
                }
            });
            setEditingItems(prev => ({ ...prev, [item.id]: false }));
            AlertService.success(t('common.success'), `${t('common.save')}: ${item.name || 'item'}`);
        } catch (err) {
            console.error(err);
            AlertService.error(t('common.error'), t('common.failed'));
        }
    };

    const handleRefresh = async () => {
        await refetch();
    };

    const focusedBinsString = useMemo(() => {
        if (!ticket) return '';
        return ticket.items
            .map(item => item.locationId)
            .filter((id): id is number => !!id)
            .join(',');
    }, [ticket]);

    const openWarehouseForItem = (item: StockCountItem) => {
        if (!ticket) return;
        router.push({
            pathname: '/warehouse-view',
            params: {
                warehouseId: String(ticket.warehouseId || ''),
                inventoryCountTicketId: String(ticket.id),
                focusedBins: String(item.locationId || ''),
                focusedItemId: String(item.productId),
                focusedItemName: item.name || `${t('common.item')} #${item.productId}`,
            },
        } as any);
    };

    const isTicketFinished = ticket?.status?.toLowerCase() === 'finished';

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
        );
    }

    if (error || !ticket) {
        return (
            <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={48} color={COLORS.danger} />
                <Text style={styles.errorText}>{t('common.noData')}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={goBack}>
                    <Text style={styles.retryBtnText}>{t('common.back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader
                title={t('inventoryCount.ticketTitle')}
                subtitle={ticket.name || `CNT-${ticket.id}`}
            />

            <RefreshContainer
                style={styles.content}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
                onRefresh={handleRefresh}
            >
                <Card style={styles.infoCard}>
                    <View style={styles.statusSection}>
                        <View style={[styles.statusBadge, {
                            backgroundColor: isTicketFinished ? COLORS.success + '20' : COLORS.warning + '20'
                        }]}>
                            <View style={[styles.statusDot, {
                                backgroundColor: isTicketFinished ? COLORS.success : COLORS.warning
                            }]} />
                            <Text style={[styles.statusBadgeText, {
                                color: isTicketFinished ? COLORS.success : COLORS.warning
                            }]}>
                                {isTicketFinished ? t('common.done') : t('common.pending')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Feather name="info" size={16} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>{t('inventoryCount.countType')}</Text>
                            <Text style={styles.infoValue}>{ticket.type || 'Manual'}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Feather name="calendar" size={16} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>{t('common.loading')}</Text>
                            <Text style={styles.infoValue}>
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}
                            </Text>
                        </View>
                    </View>
                </Card>

                <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderRow}>
                        <View>
                            <Text style={styles.sectionTitle}>{t('outbound.productList')}</Text>
                            <Text style={styles.sectionSubtitle}>{ticket.items.length} {t('tabs.tasks').toLowerCase()}</Text>
                        </View>
                        <View style={styles.progressBadge}>
                            <Text style={styles.progressBadgeText}>
                                {ticket.items.filter(i => i.countedQuantity != null).length}/{ticket.items.length}
                            </Text>
                        </View>
                    </View>
                </View>

                {ticket.items
                    .map(item => {
                        const isBeingEdited = editingItems[item.id];
                        const isConfirmed = item.countedQuantity != null;
                        const isRevealed = (isConfirmed && !isBeingEdited) || isTicketFinished;

                        const count = item.countedQuantity ?? 0;
                        const diff = count - item.systemQuantity;

                        return (
                            <Card key={item.id} style={[styles.itemCard, isRevealed && styles.itemCardRevealed]}>
                                <View style={itemHeaderStyle.itemHeader}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.productName}>{item.name || `Product #${item.productId}`}</Text>
                                        <View style={styles.skuBadge}>
                                            <Text style={styles.skuText}>{item.sku || 'N/A'}</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.statusBadgeItem, {
                                        backgroundColor: isConfirmed ? COLORS.success + '20' : COLORS.warning + '20'
                                    }]}>
                                        <Text style={[styles.statusBadgeItemText, {
                                            color: isConfirmed ? COLORS.success : COLORS.warning
                                        }]}>
                                            {isConfirmed ? t('inventoryCount.counted') : t('common.pending')}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.countGrid}>
                                    {!isStaff && (
                                        <View style={styles.countColumn}>
                                            <Text style={styles.countLabel}>{t('inventoryCount.system')}</Text>
                                            <TouchableOpacity
                                                activeOpacity={isRevealed ? 1 : 0.7}
                                                style={[styles.qtyBox, isRevealed && styles.qtyBoxRevealed]}
                                                onPress={() => {
                                                    if (!isRevealed) {
                                                        AlertService.warning(
                                                            t('inventoryCount.blindCountMode'),
                                                            t('inventoryCount.blindCountMsg')
                                                        );
                                                    }
                                                }}
                                            >
                                                <Text style={isRevealed ? styles.systemQtyValue : styles.hiddenQtyValue}>
                                                    {isRevealed ? item.systemQuantity : '??'}
                                                </Text>
                                                {!isRevealed && <Feather name="lock" size={14} color={COLORS.textMuted} />}
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    <View style={styles.countColumn}>
                                        <View style={[styles.compactCountRow, isRevealed && styles.compactCountRowRevealed]}>
                                            <Text style={styles.compactCountLabel}>{t('inventoryCount.counted')}:</Text>
                                            <TextInput
                                                style={[styles.compactCountInput, (isRevealed || isBeingEdited || !isConfirmed) && styles.revealedInput]}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                value={isBeingEdited || !isConfirmed ? (localCounts[item.id] ?? '') : (item.countedQuantity?.toString() || '0')}
                                                onChangeText={(val) => setLocalCounts(prev => ({ ...prev, [item.id]: val }))}
                                                editable={!isTicketFinished && (!isConfirmed || isBeingEdited)}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {isRevealed && !isStaff && (
                                    <View style={styles.revealedFooterRow}>
                                        <View style={[styles.diffBadge, {
                                            backgroundColor: diff === 0 ? '#DCFCE7' : (diff > 0 ? '#FEF3C7' : '#FEE2E2'),
                                            flex: 1,
                                            height: 38,
                                            justifyContent: 'center'
                                        }]}>
                                            <Feather
                                                name={diff === 0 ? "check-circle" : (diff > 0 ? "arrow-up" : "arrow-down")}
                                                size={13}
                                                color={diff === 0 ? '#166534' : (diff > 0 ? '#B45309' : '#991B1B')}
                                            />
                                            <Text style={[styles.diffBadgeText, {
                                                color: diff === 0 ? '#166534' : (diff > 0 ? '#B45309' : '#991B1B')
                                            }]} numberOfLines={1} adjustsFontSizeToFit>
                                                {diff === 0 ? t('inventoryCount.match') : (diff > 0 ? `${t('inventoryCount.over')}: +${diff}` : `${t('inventoryCount.short')}: ${diff}`)}
                                            </Text>
                                        </View>

                                        {!isTicketFinished && (
                                            <TouchableOpacity
                                                style={[styles.editBtn, { flex: 1, height: 38, justifyContent: 'center' }]}
                                                onPress={() => handleEditItem(item.id)}
                                            >
                                                <Feather name="edit-2" size={13} color={COLORS.primary} />
                                                <Text style={styles.editBtnText} numberOfLines={1} adjustsFontSizeToFit>{t('profile.editProfile').split(' ')[0]}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                <View style={styles.itemActionRow}>
                                    {isRevealed && isStaff && !isTicketFinished && (
                                        <TouchableOpacity
                                            style={styles.flexActionBtn}
                                            onPress={() => handleEditItem(item.id)}
                                        >
                                            <Feather name="edit-2" size={14} color={COLORS.primary} />
                                            <Text style={styles.actionBtnText} numberOfLines={1} adjustsFontSizeToFit>{t('profile.editProfile').split(' ')[0]}</Text>
                                        </TouchableOpacity>
                                    )}

                                    {(!isConfirmed || isBeingEdited) && !isTicketFinished && (
                                        <TouchableOpacity
                                            style={[styles.flexActionBtn, { backgroundColor: COLORS.success }]}
                                            onPress={() => handleConfirmCount(item)}
                                            disabled={updateItem.isPending}
                                        >
                                            {updateItem.isPending ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <>
                                                    <Feather name="check" size={14} color="#fff" />
                                                    <Text style={[styles.actionBtnText, { color: '#fff' }]} numberOfLines={1} adjustsFontSizeToFit>{t('common.confirm')}</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}

                                    {item.locationId ? (
                                        <TouchableOpacity
                                            style={[styles.flexActionBtn, { backgroundColor: COLORS.primary + '10' }]}
                                            onPress={() => openWarehouseForItem(item)}
                                        >
                                            <Feather name="map-pin" size={14} color={COLORS.primary} />
                                            <Text style={styles.actionBtnText} numberOfLines={1} adjustsFontSizeToFit>{t('inventoryCount.findOnMap')}</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.flexActionBtn, { backgroundColor: COLORS.info + '10' }]}
                                            onPress={() => {
                                                if (!ticket?.warehouseId) {
                                                    AlertService.warning(t('common.error'), t('common.failed'));
                                                    return;
                                                }
                                                router.push({
                                                    pathname: '/warehouse-view',
                                                    params: {
                                                        warehouseId: String(ticket.warehouseId || ''),
                                                        inventoryCountTicketId: String(ticket.id),
                                                        focusedItemId: String(item.productId),
                                                        focusedItemName: item.name || `Item #${item.productId}`,
                                                    },
                                                } as any);
                                            }}
                                        >
                                            <Feather name="search" size={14} color={COLORS.info} />
                                            <Text style={[styles.actionBtnText, { color: COLORS.info }]} numberOfLines={1} adjustsFontSizeToFit>{t('common.search')}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </Card>
                        );
                    })}
                <View style={{ height: 40 }} />
            </RefreshContainer>
        </View>
    );
}

const itemHeaderStyle = StyleSheet.create({
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
});

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textMuted,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#F9FAFB',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: 24,
    },
    retryBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    infoCard: {
        marginBottom: 20,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
    },
    statusSection: {
        marginBottom: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    blindCountingBox: {
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    blindHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    blindTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#B45309',
    },
    blindCountingText: {
        fontSize: 12,
        color: '#92400E',
        lineHeight: 18,
    },
    warehouseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    warehouseIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    warehouseTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 2,
    },
    warehouseSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    progressBadge: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    progressBadgeText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    itemCard: {
        marginBottom: 16,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    itemCardRevealed: {
        backgroundColor: '#FBFBFC',
        borderColor: '#E5E7EB',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    itemInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 6,
    },
    skuBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
    },
    skuText: {
        fontSize: 11,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    statusBadgeItem: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusBadgeItemText: {
        fontSize: 11,
        fontWeight: '700',
    },
    countGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    countColumn: {
        flex: 1,
    },
    countLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginBottom: 6,
        fontWeight: '600',
        textAlign: 'center',
    },
    qtyBox: {
        height: 48,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    qtyBoxRevealed: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    systemQtyValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    hiddenQtyValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textMuted,
    },
    compactCountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 42,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        gap: 8,
    },
    compactCountRowRevealed: {
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
    },
    compactCountLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    compactCountInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'right',
        padding: 0,
    },
    revealedInput: {
        color: COLORS.text,
    },
    diffRow: {
        marginBottom: 16,
        alignItems: 'center',
    },
    diffBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    diffBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    confirmItemBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    confirmItemBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    revealedFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    revealedFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    revealedText: {
        fontSize: 13,
        color: '#059669',
        fontWeight: '600',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: COLORS.primary + '10',
    },
    editBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    locationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    viewOnMapText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginLeft: 'auto',
        marginRight: 4,
    },
    boldText: {
        fontWeight: 'bold',
        color: COLORS.text,
    },
    itemActionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    flexActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.primary + '08',
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
});
