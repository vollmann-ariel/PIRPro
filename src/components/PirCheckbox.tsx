import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';

type Props = {
  value: boolean;
  onToggle: () => void;
};

export function PirCheckbox({ value, onToggle }: Props) {
  return (
    <Pressable style={styles.row} accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={onToggle}>
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>{value && <Text style={styles.checkboxMark}>✓</Text>}</View>
      <Text style={styles.label}>Marcar como PIR</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxMark: { color: colors.textInverse, fontSize: 14, lineHeight: 14 },
  label: { ...typography.body, color: colors.textPrimary },
});
