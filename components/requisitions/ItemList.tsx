import { COLORS } from '@/constants/color';
import type { RequisitionItem } from '@/types/requisition';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RequisitionItemListProps {
    items: RequisitionItem[];
    showNotes?: boolean;
}

export function RequisitionItemList({ items, showNotes = false }: RequisitionItemListProps) {
    return (
        <View style={styles.container}>
            {items.map((item, index) => (
                <View key={item.id}>
                    <View style={styles.item}>
                        <View style={styles.itemHeader}>
                            <View style={styles.itemLeft}>
                                <View style={styles.itemIcon}>
                                    <Feather name="package" size={16} color={COLORS.primary} />
                                </View>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.productName}</Text>
                                    <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                                </View>
                            </View>
                            <View style={styles.quantityBadge}>
                                <Text style={styles.quantityText}>{item.quantity}</Text>
                                {item.unit && <Text style={styles.unitText}>{item.unit}</Text>}
                            </View>
                        </View>
                        {showNotes && item.notes && (
                            <View style={styles.notesContainer}>
                                <Feather name="message-circle" size={12} color={COLORS.textMuted} />
                                <Text style={styles.notesText}>{item.notes}</Text>
                            </View>
                        )}
                    </View>
                    {index < items.length - 1 && <View style={styles.divider} />}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    item: {
        paddingVertical: 8,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    itemIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    itemSku: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    quantityBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    quantityText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    unitText: {
        fontSize: 11,
        color: '#fff',
        opacity: 0.9,
    },
    notesContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 8,
        paddingLeft: 48,
        paddingRight: 80,
    },
    notesText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.textMuted,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 8,
    },
});
