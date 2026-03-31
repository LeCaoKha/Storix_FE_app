import { Button, Card, RefreshContainer, ScreenHeader } from '@/components';
import { getBottomSafePadding } from '@/components/ui/safeArea';
import { COLORS } from '@/constants/color';
import { useQualityCheckTransfer, useTransferOrder } from '@/hooks/transfer.hooks';
import { useAppBack } from '@/hooks/useAppBack';
import { AlertService } from '@/stores/alert.store';
import { TransferQualityCheckItemRequest, TransferQualityCheckPayload } from '@/types/transfer';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type QualityRow = {
  productId: number;
  productName: string;
  expectedQuantity: number;
  okQuantity: number;
  badQuantity: number;
  note?: string;
};

export default function QualityCheckTransferScreen() {
  const goBack = useAppBack();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const transferId = parseInt(id || '0', 10);

  const { data: transfer, isLoading, refetch } = useTransferOrder(transferId);

  const handleRefresh = async () => {
    await refetch();
  };
  const qualityMutation = useQualityCheckTransfer();

  const [note, setNote] = useState('');
  const [rows, setRows] = useState<Record<number, QualityRow>>({});

  useEffect(() => {
    if (!transfer?.items) return;

    const mapped: Record<number, QualityRow> = {};
    transfer.items.forEach((item) => {
      if (!item.productId) return;
      mapped[item.productId] = {
        productId: item.productId,
        productName: item.productName || `San pham #${item.productId}`,
        expectedQuantity: Number(item.quantity || 0),
        okQuantity: Number(item.quantity || 0),
        badQuantity: 0,
        note: '',
      };
    });

    setRows(mapped);
  }, [transfer]);

  const updateRowNumber = (
    productId: number,
    field: 'okQuantity' | 'badQuantity',
    value: string,
  ) => {
    const numValue = parseInt(value || '0', 10);
    if (Number.isNaN(numValue) || numValue < 0) return;

    setRows((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: numValue,
      },
    }));
  };

  const updateRowNote = (productId: number, value: string) => {
    setRows((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        note: value,
      },
    }));
  };

  const rowList = useMemo(() => Object.values(rows), [rows]);

  const validateRows = (): string | null => {
    if (!rowList.length) return 'Khong co san pham de kiem hang.';

    for (const row of rowList) {
      if (row.okQuantity < 0 || row.badQuantity < 0) {
        return `So luong khong hop le cho ${row.productName}.`;
      }

      if (row.okQuantity + row.badQuantity > row.expectedQuantity) {
        return `Tong OK + Loi vuot qua so luong yeu cau cua ${row.productName}.`;
      }
    }

    return null;
  };

  const handleSubmitQuality = () => {
    const validationError = validateRows();
    if (validationError) {
      AlertService.error('Du lieu chua hop le', validationError);
      return;
    }

    const items: TransferQualityCheckItemRequest[] = rowList.map((row) => ({
      productId: row.productId,
      okQuantity: row.okQuantity,
      badQuantity: row.badQuantity,
      note: row.note?.trim() ? row.note.trim() : undefined,
    }));

    const payload: TransferQualityCheckPayload = {
      note: note.trim() ? note.trim() : undefined,
      items,
    };

    qualityMutation.mutate(
      { id: transferId, payload },
      {
        onSuccess: () => {
          AlertService.success('Thanh cong', 'Da xac nhan kiem hang luan chuyen.');
          goBack();
        },
        onError: (error: any) => {
          AlertService.error('Loi', error?.response?.data?.message || 'Khong the cap nhat kiem hang.');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Dang tai...</Text>
      </View>
    );
  }

  if (!transfer) {
    return (
      <View style={styles.center}>
        <Feather name="alert-circle" size={52} color={COLORS.border} />
        <Text style={styles.errorText}>Khong tim thay phieu luan chuyen.</Text>
        <Button title="Quay lai" onPress={goBack} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Kiem hang luan chuyen"
        subtitle={transfer.referenceCode || `Phieu #${transfer.id}`}
      />

      <RefreshContainer 
        style={styles.content} 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 120 + insets.bottom }]}
        onRefresh={handleRefresh}
      >
        <Card style={styles.card}>
          <View style={styles.infoRow}>
            <Feather name="check-square" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>Nhap so luong OK va loi cho tung san pham</Text>
          </View>
        </Card>

        <View style={styles.list}>
          {rowList.map((row, index) => (
            <View key={row.productId} style={styles.itemWrap}>
              <Text style={styles.productName}>{row.productName}</Text>
              <Text style={styles.expectedText}>Yeu cau: {row.expectedQuantity}</Text>

              <View style={styles.inputsRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>So luong OK</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(row.okQuantity)}
                    onChangeText={(value) => updateRowNumber(row.productId, 'okQuantity', value)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>So luong Loi</Text>
                  <TextInput
                    style={[styles.input, styles.badInput]}
                    keyboardType="numeric"
                    value={String(row.badQuantity)}
                    onChangeText={(value) => updateRowNumber(row.productId, 'badQuantity', value)}
                  />
                </View>
              </View>

              <TextInput
                style={styles.noteInput}
                placeholder="Ghi chu cho san pham nay (neu co)"
                value={row.note}
                onChangeText={(value) => updateRowNote(row.productId, value)}
              />

              {index < rowList.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <Card style={[styles.card, styles.noteCard]}>
          <Text style={styles.inputLabel}>Ghi chu tong</Text>
          <TextInput
            style={styles.globalNoteInput}
            placeholder="Mo ta tong quan ket qua kiem hang"
            multiline
            numberOfLines={3}
            value={note}
            onChangeText={setNote}
          />
        </Card>
      </RefreshContainer>

      <View style={[styles.actionBar, { paddingBottom: getBottomSafePadding(insets.bottom, 16) }]}>
        <Button
          title="Xac nhan kiem hang"
          onPress={handleSubmitQuality}
          loading={qualityMutation.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  card: { marginBottom: 16, padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  list: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  itemWrap: { padding: 16 },
  productName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  expectedText: { fontSize: 12, color: COLORS.textMuted, marginBottom: 10 },
  inputsRow: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 6 },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
    fontWeight: '600',
    color: COLORS.text,
  },
  badInput: { borderColor: '#FECACA', color: COLORS.danger },
  noteInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
    backgroundColor: '#FFF',
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginTop: 14 },
  noteCard: { marginTop: 8 },
  globalNoteInput: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlignVertical: 'top',
    fontSize: 14,
    color: COLORS.text,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
});
