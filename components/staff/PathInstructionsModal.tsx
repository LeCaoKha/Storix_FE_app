import { COLORS } from '@/constants/color';
import { PathResult } from '@/types/warehouse';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PathInstructionsModalProps {
  visible: boolean;
  pathResult: PathResult | null;
  fromLocation?: string;
  toLocation: string;
  onClose: () => void;
}

export const PathInstructionsModal: React.FC<PathInstructionsModalProps> = ({
  visible,
  pathResult,
  fromLocation = 'Current location',
  toLocation,
  onClose,
}) => {
  if (!pathResult) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Feather name="navigation" size={24} color={COLORS.primary} />
              <View style={styles.headerText}>
                <Text style={styles.title}>Route Instructions</Text>
                <Text style={styles.subtitle}>
                  {fromLocation} → {toLocation}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Feather name="map-pin" size={18} color={COLORS.primary} />
              <View>
                <Text style={styles.summaryLabel}>Steps</Text>
                <Text style={styles.summaryValue}>
                  {pathResult.instructions.length - 2} steps
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Feather name="navigation" size={18} color={COLORS.primary} />
              <View>
                <Text style={styles.summaryLabel}>Distance</Text>
                <Text style={styles.summaryValue}>
                  ~{pathResult.totalDistance.toFixed(1)}m
                </Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <ScrollView style={styles.instructionsContainer} showsVerticalScrollIndicator={false}>
            {pathResult.instructions.map((instruction, index) => {
              const isFirst = index === 0;
              const isLast = index === pathResult.instructions.length - 1;

              return (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.stepIndicator}>
                    {isFirst ? (
                      <View style={[styles.stepDot, styles.stepDotStart]} />
                    ) : isLast ? (
                      <View style={[styles.stepDot, styles.stepDotEnd]} />
                    ) : (
                      <View style={styles.stepDot}>
                        <Text style={styles.stepNumber}>{index}</Text>
                      </View>
                    )}
                    {!isLast && <View style={styles.stepLine} />}
                  </View>
                  <View style={styles.instructionContent}>
                    <Text
                      style={[
                        styles.instructionText,
                        (isFirst || isLast) && styles.instructionTextBold,
                      ]}
                    >
                      {instruction}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={onClose}>
              <Text style={styles.actionButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  instructionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 16,
    width: 32,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotStart: {
    backgroundColor: '#4CAF50',
  },
  stepDotEnd: {
    backgroundColor: '#FF5722',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
    marginTop: 4,
  },
  instructionContent: {
    flex: 1,
    paddingTop: 6,
  },
  instructionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  instructionTextBold: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  actions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
