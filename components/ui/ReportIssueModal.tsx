import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { COLORS } from '@/constants/color';
import type { IssueType, OrderItem } from '@/types/order';

interface ReportIssueModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (report: {
        issueType: IssueType;
        itemId?: string;
        description: string;
    }) => void;
    orderNumber: string;
    items?: OrderItem[];
}

export function ReportIssueModal({
    visible,
    onClose,
    onSubmit,
    orderNumber,
    items = []
}: ReportIssueModalProps) {
    const [selectedIssueType, setSelectedIssueType] = useState<IssueType | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
    const [description, setDescription] = useState('');

    const issueTypes: { type: IssueType; label: string; icon: string; color: string }[] = [
        { type: 'missing', label: 'Thiếu hàng', icon: 'alert-circle', color: '#EF4444' },
        { type: 'damaged', label: 'Hàng hư hỏng', icon: 'alert-triangle', color: '#F59E0B' },
        { type: 'wrong_location', label: 'Sai vị trí', icon: 'map-pin', color: '#8B5CF6' },
        { type: 'quality', label: 'Vấn đề chất lượng', icon: 'star', color: '#F59E0B' },
        { type: 'quantity_mismatch', label: 'Sai số lượng', icon: 'hash', color: '#EF4444' },
        { type: 'other', label: 'Vấn đề khác', icon: 'info', color: '#64748B' },
    ];

    const handleSubmit = () => {
        if (!selectedIssueType || !description.trim()) {
            return;
        }

        onSubmit({
            issueType: selectedIssueType,
            itemId: selectedItemId,
            description: description.trim(),
        });

        // Reset form
        setSelectedIssueType(null);
        setSelectedItemId(undefined);
        setDescription('');
        onClose();
    };

    const handleClose = () => {
        setSelectedIssueType(null);
        setSelectedItemId(undefined);
        setDescription('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Feather name="alert-circle" size={24} color="#EF4444" />
                            <View>
                                <Text style={styles.headerTitle}>Báo Cáo Vấn Đề</Text>
                                <Text style={styles.headerSubtitle}>{orderNumber}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Issue Type Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Loại Vấn Đề *</Text>
                            <View style={styles.issueTypeGrid}>
                                {issueTypes.map((issueType) => (
                                    <TouchableOpacity
                                        key={issueType.type}
                                        style={[
                                            styles.issueTypeCard,
                                            selectedIssueType === issueType.type && {
                                                borderColor: issueType.color,
                                                backgroundColor: issueType.color + '15',
                                            },
                                        ]}
                                        onPress={() => setSelectedIssueType(issueType.type)}
                                    >
                                        <Feather
                                            name={issueType.icon as any}
                                            size={24}
                                            color={selectedIssueType === issueType.type ? issueType.color : COLORS.textMuted}
                                        />
                                        <Text style={[
                                            styles.issueTypeLabel,
                                            selectedIssueType === issueType.type && {
                                                color: issueType.color,
                                                fontWeight: '600',
                                            },
                                        ]}>
                                            {issueType.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Item Selection (Optional) */}
                        {items.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Sản Phẩm (Tùy chọn)</Text>
                                <View style={styles.itemsList}>
                                    <TouchableOpacity
                                        style={[
                                            styles.itemCard,
                                            !selectedItemId && styles.itemCardSelected,
                                        ]}
                                        onPress={() => setSelectedItemId(undefined)}
                                    >
                                        <Text style={styles.itemName}>Tất cả / Chung</Text>
                                    </TouchableOpacity>
                                    {items.map((item) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={[
                                                styles.itemCard,
                                                selectedItemId === item.id && styles.itemCardSelected,
                                            ]}
                                            onPress={() => setSelectedItemId(item.id)}
                                        >
                                            <Text style={styles.itemName}>{item.productName}</Text>
                                            <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Description */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mô Tả Chi Tiết *</Text>
                            <TextInput
                                style={styles.textArea}
                                multiline
                                numberOfLines={4}
                                placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
                                value={description}
                                onChangeText={setDescription}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.note}>
                            <Feather name="info" size={16} color={COLORS.textMuted} />
                            <Text style={styles.noteText}>
                                Báo cáo sẽ được gửi đến quản lý kho để xử lý. Bạn có thể tiếp tục làm việc sau khi gửi báo cáo.
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!selectedIssueType || !description.trim()) && styles.submitButtonDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={!selectedIssueType || !description.trim()}
                        >
                            <Feather name="send" size={18} color="#fff" />
                            <Text style={styles.submitButtonText}>Gửi Báo Cáo</Text>
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
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    issueTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    issueTypeCard: {
        width: '48%',
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: '#fff',
        alignItems: 'center',
        gap: 8,
    },
    issueTypeLabel: {
        fontSize: 12,
        color: COLORS.text,
        textAlign: 'center',
    },
    itemsList: {
        gap: 8,
    },
    itemCard: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: '#fff',
    },
    itemCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: 2,
    },
    itemSku: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    textArea: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: COLORS.text,
        minHeight: 100,
        backgroundColor: COLORS.background,
    },
    note: {
        flexDirection: 'row',
        gap: 10,
        padding: 12,
        backgroundColor: COLORS.background,
        borderRadius: 8,
        marginBottom: 12,
    },
    noteText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.textMuted,
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
    },
    submitButtonDisabled: {
        backgroundColor: COLORS.textMuted,
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
