import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, elevation, radius, spacing, typography } from '../theme/tokens';
import { registerConfirmHandler, type ConfirmDialogState } from '../utils/confirm';

export function ConfirmDialogHost() {
  const [state, setState] = useState<ConfirmDialogState | null>(null);

  useEffect(() => {
    registerConfirmHandler(setState);
  }, []);

  if (!state) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setState(null)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{state.title}</Text>
          <Text style={styles.message}>{state.message}</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.cancelButton} onPress={() => setState(null)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={styles.confirmButton}
              onPress={() => {
                setState(null);
                state.onConfirm();
              }}
            >
              <Text style={styles.confirmButtonText}>{state.confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...elevation.level2,
  },
  title: { ...typography.subtitle, color: colors.textPrimary },
  message: { ...typography.body, color: colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelButton: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: 'center' },
  cancelButtonText: { ...typography.subtitle, color: colors.textPrimary },
  confirmButton: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerMuted, alignItems: 'center' },
  confirmButtonText: { ...typography.subtitle, color: colors.danger },
});
