import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { LocationBadge } from '@/components/ui/LocationBadge';
import { COLORS } from '@/constants/color';
import type { OrderItem } from '@/types/order';

interface PathViewModalProps {
    visible: boolean;
    onClose: () => void;
    items: OrderItem[];
    title?: string;
}

export function PathViewModal({ visible, onClose, items, title = 'Picking Path' }: PathViewModalProps) {
    // Sort items by AI picking order
    const sortedItems = [...items].sort((a, b) => (a.aiPickingOrder || 0) - (b.aiPickingOrder || 0));

    // Calculate total distance and time
    const totalItems = sortedItems.reduce((sum, item) => sum + item.quantity, 0);
    const estimatedTime = Math.max(5, Math.ceil(sortedItems.length * 2.5)); // 2.5 min per item location
    const estimatedDistance = Math.ceil(sortedItems.length * 15); // ~15m per location

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Feather name="navigation" size={24} color={COLORS.primary} />
                            <Text style={styles.headerTitle}>{title}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Summary */}
                    <View style={styles.summary}>
                        <View style={styles.summaryItem}>
                            <Feather name="package" size={18} color={COLORS.primary} />
                            <Text style={styles.summaryLabel}>Items:</Text>
                            <Text style={styles.summaryValue}>{totalItems}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Feather name="clock" size={18} color={COLORS.primary} />
                            <Text style={styles.summaryLabel}>Time:</Text>
                            <Text style={styles.summaryValue}>~{estimatedTime} min</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Feather name="map" size={18} color={COLORS.primary} />
                            <Text style={styles.summaryLabel}>Distance:</Text>
                            <Text style={styles.summaryValue}>~{estimatedDistance}m</Text>
                        </View>
                    </View>

                    {/* AI Optimization Note */}
                    <View style={styles.aiNote}>
                        <Feather name="zap" size={16} color="#F59E0B" />
                        <Text style={styles.aiNoteText}>
                            Route được tối ưu hóa bởi AI để giảm thời gian và khoảng cách di chuyển
                        </Text>
                    </View>

                    {/* Path List */}
                    <ScrollView style={styles.pathList} showsVerticalScrollIndicator={false}>
                        {sortedItems.map((item, index) => (
                            <View key={item.id} style={styles.pathItem}>
                                <View style={styles.pathItemHeader}>
                                    <View style={styles.stepNumber}>
                                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.pathItemContent}>
                                        <Text style={styles.itemName}>{item.productName}</Text>
                                        <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                                    </View>
                                    {item.status === 'picked' && (
                                        <Feather name="check-circle" size={20} color="#10B981" />
                                    )}
                                </View>

                                <View style={styles.pathItemDetails}>
                                    <LocationBadge locationCode={item.locatorCode || ''} />
                                    <View style={styles.quantityBadge}>
                                        <Feather name="shopping-bag" size={14} color={COLORS.text} />
                                        <Text style={styles.quantityText}>×{item.quantity}</Text>
                                    </View>
                                </View>

                                {index < sortedItems.length - 1 && (
                                    <View style={styles.connector}>
                                        <Feather name="arrow-down" size={16} color={COLORS.textMuted} />
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.startButton} onPress={onClose}>
                            <Feather name="navigation" size={18} color="#fff" />
                            <Text style={styles.startButtonText}>Bắt Đầu Picking</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        backgroundColor: COLORS.background,
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 12,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    summaryLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    aiNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFBEB',
        padding: 12,
        marginHorizontal: 20,
        marginTop: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    aiNoteText: {
        flex: 1,
        fontSize: 12,
        color: '#92400E',
        lineHeight: 18,
    },
    pathList: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    pathItem: {
        marginBottom: 16,
    },
    pathItemHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 8,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    pathItemContent: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    itemSku: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    pathItemDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginLeft: 44,
    },
    quantityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.background,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    quantityText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },
    connector: {
        marginLeft: 44,
        marginTop: 8,
        marginBottom: 8,
        paddingLeft: 8,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    startButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
