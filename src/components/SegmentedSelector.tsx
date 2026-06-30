import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';

type Option<T extends string | number> = {
  value: T;
  label: string;
  color: string;
  badge?: string;
};

type Props<T extends string | number> = {
  label: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

export function SegmentedSelector<T extends string | number>({ label, options, value, onChange }: Props<T>) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${option.label}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.button, { borderColor: option.color }, selected && { backgroundColor: option.color }]}
            >
              <Text style={[styles.buttonText, { color: selected ? colors.textInverse : option.color }]}>{option.label}</Text>
              {option.badge && <Text style={styles.badge}>{option.badge}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  button: {
    flex: 1,
    minHeight: 48,
    borderWidth: 2,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { ...typography.subtitle },
  badge: { position: 'absolute', top: -8, left: -6, fontSize: 14 },
});
