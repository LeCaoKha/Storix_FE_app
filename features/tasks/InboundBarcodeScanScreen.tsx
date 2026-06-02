import { Button, Card, RefreshContainer, ScreenHeader } from '@/components';
import { COLORS } from '@/constants/color';
import { useTranslation } from '@/hooks/useTranslation';
import {
    discardBarcodeSession,
    finalizeBarcodeSession,
    getBarcodeSession,
    scanBarcode,
    startBarcodeSession
} from '@/services/inbound-order.api';
import { AlertService } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { BarcodeScanLineDto, BarcodeScanSessionDto } from '@/types/inbound-order';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function InboundBarcodeScanScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);
    
    const numericId = parseInt(id, 10);
    const [session, setSession] = useState<BarcodeScanSessionDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [skuInput, setSkuInput] = useState('');
    const [lastScannedSku, setLastScannedSku] = useState<string | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [highlightedProductId, setHighlightedProductId] = useState<number | null>(null);
    
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [isScanning, setIsScanning] = useState(false); // For API calls
    const [isCooldown, setIsCooldown] = useState(false); // To prevent continuous scanning

    const completedLines = React.useMemo(
        () => session?.lines.filter((line) => line.isComplete).length ?? 0,
        [session],
    );
    const totalLines = session?.lines.length ?? 0;
    const scanTip = session?.allComplete
        ? t('inbound.scanReadyToFinalize')
        : t('inbound.scanKeepGoing');

    const inputRef = useRef<TextInput>(null);

    const lastScannedLine = React.useMemo(() => {
        if (!lastScannedSku || !session) return null;
        const skuNormalized = String(lastScannedSku || '').trim().toUpperCase();
        return session.lines.find(l => String(l.sku || '').trim().toUpperCase() === skuNormalized) || null;
    }, [lastScannedSku, session]);

    const loadSession = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getBarcodeSession(numericId);
            setSession(data);
        } catch (error: any) {
            if (error.response?.status === 404) {
                // Session not started
            } else {
                console.error('Load session error:', error);
            }
        } finally {
            setIsLoading(false);
        }
    }, [numericId]);

    // Load or Start Session
    useEffect(() => {
        void loadSession();
    }, [loadSession]);

    const handleStartSession = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await startBarcodeSession(numericId, { staffId: user.id });
            setSession(data);
            // Avoid modal popup on start — give subtle haptic feedback instead
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        } catch (error: any) {
            AlertService.error(t('common.error'), error.response?.data?.message || t('inbound.startSessionError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleScan = async (skuToScan?: string) => {
        const sku = skuToScan || skuInput.trim();
        if (!sku || isScanning || isCooldown) return;

        setIsScanning(true);
        setScanError(null);
        
        try {
            const result = await scanBarcode(numericId, { sku });
            setSession(result.session);
            setLastScannedSku(sku);
            // Highlight the updated product line briefly
            try {
                const pid = Number(result.updatedLine?.productId || 0);
                if (pid > 0) {
                    setHighlightedProductId(pid);
                    setTimeout(() => setHighlightedProductId(null), 1200);
                }
            } catch {}
            // Haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Clear input and trigger short cooldown to avoid duplicate scans
            setSkuInput('');
            setIsCooldown(true);
            setTimeout(() => setIsCooldown(false), 1000);

            if (result.warningMessage) {
                AlertService.warning(t('common.warning'), result.warningMessage);
            }
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const msg = error.response?.data?.message || t('inbound.scanError');
            setScanError(msg);
            AlertService.error(t('common.error'), msg);
        } finally {
            setIsScanning(false);
        }
    };

    const handleFinalize = async () => {
        if (!session) return;
        
        setIsSubmitting(true);
        try {
            await finalizeBarcodeSession(numericId, { qcOverrides: [] });
            AlertService.success(t('common.success'), t('inbound.qcSuccess'));
            
            // Go to inbound detail and request the detail screen to open warehouse modal
            router.replace({
                pathname: '/(tabs)/tasks/inbound/[id]',
                params: { id: String(numericId), openWarehouse: '1' },
            } as any);
        } catch (error: any) {
            AlertService.error(t('common.error'), error.response?.data?.message || t('inbound.finalizeError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDiscard = () => {
        AlertService.confirm(
            t('common.confirm'),
            t('inbound.discardSessionConfirm'),
            async () => {
                try {
                    await discardBarcodeSession(numericId);
                    setSession(null);
                    router.back();
                } catch {
                    AlertService.error(t('common.error'), t('inbound.discardError'));
                }
            }
        );
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    // Permission handling
    if (!permission) {
        return <View style={styles.centered} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.centered}>
                <Feather name="camera-off" size={48} color={COLORS.textMuted} />
                <Text style={styles.permissionText}>{t('inbound.cameraPermissionNeeded')}</Text>
                <Button title={t('inbound.grantPermission')} onPress={requestPermission} />
            </View>
        );
    }

    if (!session) {
        return (
            <View style={styles.container}>
                <ScreenHeader title={t('inbound.barcodeScan')} subtitle={`#${numericId}`} />
                <View style={styles.emptyContainer}>
                    <Feather name="box" size={64} color={COLORS.border} />
                    <Text style={styles.emptyText}>{t('inbound.noActiveSession')}</Text>
                    <Button 
                        title={t('inbound.startScanSession')} 
                        onPress={handleStartSession}
                        style={styles.startBtn}
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader 
                title={t('inbound.barcodeScan')} 
                subtitle={`INB-${numericId}`}
                rightButton={
                    <TouchableOpacity onPress={handleDiscard}>
                        <Feather name="trash-2" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                }
            />

            <Card style={styles.flowCard}>
                <View style={styles.flowHeader}>
                    <View style={styles.flowHeaderLeft}>
                        <Feather name="camera" size={16} color={COLORS.primary} />
                        <Text style={styles.flowTitle}>{t('inbound.workflowStepScanTitle')}</Text>
                    </View>
                    <View style={[styles.flowBadge, session.allComplete ? styles.flowBadgeDone : styles.flowBadgeActive]}>
                        <Text style={[styles.flowBadgeText, session.allComplete ? styles.flowBadgeTextDone : styles.flowBadgeTextActive]}>
                            {session.allComplete ? t('common.done') : '1 / 3'}
                        </Text>
                    </View>
                </View>

                <Text style={styles.flowSubtitle}>{t('inbound.workflowStepScanDesc')}</Text>

                <View style={styles.flowStats}>
                    <View style={styles.flowStatItem}>
                        <Text style={styles.flowStatValue}>{completedLines}</Text>
                        <Text style={styles.flowStatLabel}>{t('inbound.workflowSummaryReceived')}</Text>
                    </View>
                    <View style={styles.flowStatItem}>
                        <Text style={styles.flowStatValue}>{totalLines}</Text>
                        <Text style={styles.flowStatLabel}>{t('inbound.workflowSummaryExpected')}</Text>
                    </View>
                </View>

                <Text style={styles.flowTip}>{scanTip}</Text>
            </Card>

            {isCameraActive && (
                <View style={styles.cameraContainer}>
                    <CameraView
                        style={styles.camera}
                        onBarcodeScanned={!isScanning && !isCooldown ? ({ data }) => handleScan(data) : undefined}
                        barcodeScannerSettings={{
                            barcodeTypes: ['qr', 'ean13', 'code128', 'code39'],
                        }}
                    />
                    <View style={styles.overlay}>
                        <View style={[styles.scanFrame, isCooldown && !isScanning ? { borderColor: COLORS.success } : null]} />
                        {isScanning && (
                            <View style={styles.scanningIndicator}>
                                <ActivityIndicator color="#fff" />
                            </View>
                        )}
                        {isCooldown && !isScanning && (
                            <View style={styles.cooldownIndicator}>
                                <Feather name="check" size={32} color="#fff" />
                                <Text style={styles.cooldownText}>{t('common.success')}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity 
                        style={styles.closeCameraBtn}
                        onPress={() => setIsCameraActive(false)}
                    >
                        <Feather name="x" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.scanSection}>
                <View style={styles.scanHeader}>
                    <Text style={styles.sectionTitle}>{t('inbound.scanInput')}</Text>
                    {!isCameraActive && (
                        <TouchableOpacity 
                            style={styles.openCameraBtn}
                            onPress={() => setIsCameraActive(true)}
                        >
                            <Feather name="camera" size={16} color={COLORS.primary} />
                            <Text style={styles.openCameraBtnText}>{t('inbound.useCamera')}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={[styles.scanInputWrapper, scanError ? styles.inputError : null]}>
                    <Feather name="maximize" size={20} color={COLORS.textMuted} />
                    <TextInput
                        ref={inputRef}
                        style={styles.hiddenInput}
                        value={skuInput}
                        onChangeText={setSkuInput}
                        onSubmitEditing={() => handleScan()}
                        placeholder={t('inbound.scanPlaceholder')}
                        autoFocus={!isCameraActive}
                        blurOnSubmit={false}
                        autoCapitalize="characters"
                    />
                    <Text style={styles.visibleSkuText}>
                        {skuInput || t('inbound.waitingForScan')}
                    </Text>
                </View>
                
                {lastScannedLine && !scanError && (
                    <Text style={styles.lastScanned}>
                        {t('inbound.lastScanned')}: <Text style={{fontWeight: '700'}}>{lastScannedLine.sku}</Text>
                        {'  '}
                        <Text style={{fontWeight: '700'}}>{lastScannedLine.productName}</Text>
                        {'  •  '}
                        <Text>{lastScannedLine.scannedQuantity} / {lastScannedLine.expectedQuantity}</Text>
                    </Text>
                )}
                {isScanning ? (
                    <Text style={styles.scanningText}>{t('inbound.scanning')}</Text>
                ) : scanError ? (
                    <Text style={styles.errorText}>{scanError}</Text>
                ) : null}
            </View>

            <RefreshContainer 
                style={styles.content}
                onRefresh={loadSession}
                contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            >
                <View style={styles.progressHeader}>
                    <Text style={styles.sectionTitle}>{t('inbound.scanProgress')}</Text>
                    <Text style={styles.itemCount}>
                        {session.lines.filter(l => l.isComplete).length} / {session.lines.length} {t('common.items')}
                    </Text>
                </View>

                {session.lines.map((line: BarcodeScanLineDto) => (
                    <Card key={line.productId} style={[styles.lineCard, highlightedProductId === line.productId ? styles.highlightedLine : null]}>
                        <View style={styles.lineHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.productName}>{line.productName}</Text>
                                <Text style={styles.skuText}>{line.sku}</Text>
                            </View>
                            <View style={[
                                styles.qtyBadge, 
                                line.isComplete ? styles.completeBadge : null,
                                line.isOverScanned ? styles.overScannedBadge : null
                            ]}>
                                <Text style={[
                                    styles.qtyText,
                                    line.isComplete ? styles.completeText : null,
                                    line.isOverScanned ? styles.overScannedText : null
                                ]}>
                                    {line.scannedQuantity} / {line.expectedQuantity}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[
                                styles.progressBarFill, 
                                { 
                                    width: `${Math.min(100, (line.scannedQuantity / line.expectedQuantity) * 100)}%`,
                                    backgroundColor: line.isOverScanned ? COLORS.warning : (line.isComplete ? COLORS.success : COLORS.primary)
                                }
                            ]} />
                        </View>
                    </Card>
                ))}
            </RefreshContainer>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <Button 
                    title={t('inbound.finalizeScan')} 
                    onPress={handleFinalize}
                    loading={isSubmitting}
                    disabled={isSubmitting || session.lines.length === 0}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionText: {
        fontSize: 16,
        color: COLORS.text,
        textAlign: 'center',
        marginVertical: 20,
        paddingHorizontal: 40,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    startBtn: {
        width: '100%',
    },
    flowCard: {
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    flowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    flowHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    flowTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    flowBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    flowBadgeActive: {
        backgroundColor: COLORS.primary + '12',
    },
    flowBadgeDone: {
        backgroundColor: COLORS.success + '12',
    },
    flowBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    flowBadgeTextActive: {
        color: COLORS.primary,
    },
    flowBadgeTextDone: {
        color: COLORS.success,
    },
    flowSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        lineHeight: 18,
        marginBottom: 12,
    },
    flowStats: {
        flexDirection: 'row',
        gap: 10,
    },
    flowStatItem: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    flowStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 2,
    },
    flowStatLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    flowTip: {
        marginTop: 12,
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
        lineHeight: 17,
    },
    cameraContainer: {
        width: '100%',
        height: SCREEN_WIDTH * 0.7,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    scanFrame: {
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_WIDTH * 0.4,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    scanningIndicator: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 20,
    },
    cooldownIndicator: {
        position: 'absolute',
        backgroundColor: 'rgba(34, 197, 94, 0.8)', // Success green
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cooldownText: {
        color: '#fff',
        fontWeight: 'bold',
        marginTop: 4,
        fontSize: 14,
    },
    closeCameraBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanSection: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    scanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    openCameraBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    openCameraBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    scanInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: COLORS.danger,
        backgroundColor: COLORS.danger + '05',
    },
    hiddenInput: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0,
    },
    visibleSkuText: {
        marginLeft: 12,
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    lastScanned: {
        marginTop: 8,
        fontSize: 12,
        color: COLORS.success,
        textAlign: 'center',
    },
    scanningText: {
        marginTop: 8,
        fontSize: 12,
        color: COLORS.primary,
        textAlign: 'center',
        fontWeight: '600',
    },
    errorText: {
        marginTop: 8,
        fontSize: 12,
        color: COLORS.danger,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    itemCount: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    lineCard: {
        marginBottom: 12,
        padding: 12,
    },
    lineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    skuText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    qtyBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    qtyText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    completeBadge: {
        backgroundColor: COLORS.success + '15',
    },
    completeText: {
        color: COLORS.success,
    },
    overScannedBadge: {
        backgroundColor: COLORS.warning + '15',
    },
    overScannedText: {
        color: COLORS.warning,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    highlightedLine: {
        borderColor: COLORS.primary,
        borderWidth: 2,
        backgroundColor: '#F0FDFA',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    }
});
