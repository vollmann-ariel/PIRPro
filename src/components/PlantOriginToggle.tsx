import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';

const PLANT_PRESETS = ['Brasil', 'Argentina', 'Turquía', 'Bélgica', 'USA'] as const;

type Props = {
  value: string | null;
  onChange: (plant: string) => void;
};

export function PlantOriginToggle({ value, onChange }: Props) {
  const isOtro = value !== null && !(PLANT_PRESETS as readonly string[]).includes(value);

  return (
    <View>
      <Text style={styles.label}>Planta de origen</Text>
      <View style={styles.row}>
        {PLANT_PRESETS.map((plant) => {
          const selected = value === plant;
          return (
            <Pressable
              key={plant}
              accessibilityRole="button"
              accessibilityLabel={`Planta de origen ${plant}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(plant)}
              style={[styles.button, selected && styles.buttonSelected]}
            >
              <Text style={[styles.buttonText, selected && styles.buttonTextSelected]}>{plant}</Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Otra planta de origen"
          accessibilityState={{ selected: isOtro }}
          onPress={() => { if (!isOtro) onChange(''); }}
          style={[styles.button, isOtro && styles.buttonSelected]}
        >
          <Text style={[styles.buttonText, isOtro && styles.buttonTextSelected]}>Otro</Text>
        </Pressable>
      </View>
      {isOtro && (
        <TextInput
          autoFocus
          style={styles.otroInput}
          value={value ?? ''}
          onChangeText={onChange}
          placeholder="Nombre de la planta"
          placeholderTextColor={colors.textSecondary}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  buttonText: { ...typography.subtitle, color: colors.textPrimary },
  buttonTextSelected: { color: colors.textInverse },
  otroInput: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
  },
});
