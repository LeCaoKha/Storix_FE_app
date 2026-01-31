import { COLORS } from '@/constants/color';
import type { ScanResult } from '@/types/scanning';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface ScannerModalProps {
    visible: boolean;
    onClose: () => void;
    onScan: (code: string) => void;
    title: string;
    isScanning: boolean;
    scanResult: ScanResult | null;
    recentScans?: ScanResult[];
}

export function ScannerModal({
    visible,
    onClose,
    onScan,
    title,
    isScanning,
    scanResult,
    recentScans = []
}: ScannerModalProps) {
    const [manualCode, setManualCode] = useState('');

    const handleManualScan = () => {
        if (manualCode.trim()) {
            onScan(manualCode.trim());
            setManualCode('');
        }
    };

    const handleClose = () => {
        setManualCode('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        {/* Camera Placeholder */}
                        <View style={styles.cameraPlaceholder}>
                            {isScanning ? (
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            ) : (
                                <>
                                    <Feather name="camera" size={48} color={COLORS.textMuted} />
                                    <Text style={styles.cameraText}>
                                        Camera scanner (coming soon)
                                    </Text>
                                </>
                            )}
                        </View>

                        {/* Manual Input */}
                        <View style={styles.manualSection}>
                            <Text style={styles.sectionTitle}>Or enter manually:</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter barcode/SKU"
                                    value={manualCode}
                                    onChangeText={setManualCode}
                                    autoCapitalize="characters"
                                    onSubmitEditing={handleManualScan}
                                    returnKeyType="done"
                                />
                                <TouchableOpacity
                                    style={styles.scanButton}
                                    onPress={handleManualScan}
                                    disabled={isScanning || !manualCode.trim()}
                                >
                                    <Feather name="check" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Scan Result */}
                        {scanResult && (
                            <View style={[
                                styles.resultCard,
                                scanResult.success ? styles.successCard : styles.errorCard
                            ]}>
                                <Feather
                                    name={scanResult.success ? "check-circle" : "x-circle"}
                                    size={20}
                                    color={scanResult.success ? "#10B981" : "#EF4444"}
                                />
                                <Text style={[
                                    styles.resultText,
                                    scanResult.success ? styles.successText : styles.errorText
                                ]}>
                                    {scanResult.message}
                                </Text>
                            </View>
                        )}

                        {/* Recent Scans */}
                        {recentScans.length > 0 && (
                            <View style={styles.historySection}>
                                <Text style={styles.sectionTitle}>Recent Scans</Text>
                                {recentScans.slice(-5).reverse().map((scan, index) => (
                                    <View key={index} style={styles.historyItem}>
                                        <Feather
                                            name={scan.success ? "check" : "x"}
                                            size={16}
                                            color={scan.success ? "#10B981" : "#EF4444"}
                                        />
                                        <Text style={styles.historyCode}>{scan.code}</Text>
                                        <Text style={styles.historyTime}>
                                            {scan.timestamp.toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
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
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    cameraPlaceholder: {
        height: 200,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    cameraText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textMuted,
    },
    manualSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    scanButton: {
        backgroundColor: COLORS.primary,
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    successCard: {
        backgroundColor: '#D1FAE5',
    },
    errorCard: {
        backgroundColor: '#FEE2E2',
    },
    resultText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    successText: {
        color: '#065F46',
    },
    errorText: {
        color: '#991B1B',
    },
    historySection: {
        marginTop: 8,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    historyCode: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    historyTime: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
});
