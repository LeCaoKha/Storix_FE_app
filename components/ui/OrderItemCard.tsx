import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants/color';
import type { OrderItem } from '@/types/order';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface OrderItemCardProps {
    item: OrderItem;
    showLocation?: boolean;
    showProgress?: boolean;
    type?: 'inbound' | 'outbound';
}

export function OrderItemCard({ item, showLocation = true, showProgress = false, type = 'outbound' }: OrderItemCardProps) {
    const getProgressInfo = () => {
        if (!showProgress) return null;

        if (type === 'outbound' && item.pickedQuantity !== undefined) {
            const percentage = (item.pickedQuantity / item.quantity) * 100;
            return {
                current: item.pickedQuantity,
                total: item.quantity,
                percentage,
                isComplete: item.pickedQuantity === item.quantity,
            };
        }

        if (type === 'inbound' && item.receivedQuantity !== undefined) {
            const percentage = (item.receivedQuantity / item.quantity) * 100;
            return {
                current: item.receivedQuantity,
                total: item.quantity,
                percentage,
                isComplete: item.receivedQuantity === item.quantity,
            };
        }

        return null;
    };

    const progress = getProgressInfo();

    return (
        <Card style={styles.card}>
            <View style={styles.header}>
                <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.productName}</Text>
                    <Text style={styles.sku}>SKU: {item.sku}</Text>
                </View>
                {item.status === 'picked' && (
                    <Feather name="check-circle" size={20} color={COLORS.success} />
                )}
                {item.status === 'received' && (
                    <Feather name="check-circle" size={20} color={COLORS.success} />
                )}
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Feather name="package" size={16} color={COLORS.textMuted} />
                    <Text style={styles.detailText}>
                        Quantity: <Text style={styles.detailValue}>{item.quantity}</Text>
                    </Text>
                </View>

                {showLocation && item.location && (
                    <View style={styles.detailRow}>
                        <Feather name="map-pin" size={16} color={COLORS.textMuted} />
                        <Text style={styles.detailText}>
                            Location: <Text style={styles.detailValue}>{item.location}</Text>
                        </Text>
                    </View>
                )}

                {progress && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressText}>
                                {progress.current} / {progress.total}
                            </Text>
                            <Text style={styles.progressPercentage}>
                                {Math.round(progress.percentage)}%
                            </Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${progress.percentage}%`,
                                        backgroundColor: progress.isComplete
                                            ? COLORS.success
                                            : COLORS.primary,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                )}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    sku: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    details: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    detailValue: {
        fontWeight: '600',
        color: COLORS.text,
    },
    progressContainer: {
        marginTop: 8,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    progressText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    progressPercentage: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    progressBar: {
        height: 6,
        backgroundColor: COLORS.secondary,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
});
