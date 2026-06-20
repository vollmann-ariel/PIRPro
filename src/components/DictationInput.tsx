import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';
import { capitalizeFirst } from '../utils/text';
import { useVoiceDictation } from '../voice/voice-dictation';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  onFocus?: () => void;
};

export function DictationInput({ label, value, onChangeText, placeholder, multiline = false, maxLength, onFocus }: Props) {
  const valueRef = useRef(value);
  valueRef.current = value;

  const { isAvailable, isListening, start, stop } = useVoiceDictation((transcript) => {
    const capitalized = capitalizeFirst(transcript);
    onChangeText(valueRef.current ? `${valueRef.current} ${capitalized}` : capitalized);
  });

  return (
    <View style={styles.field}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isListening ? `Detener dictado de ${label.toLowerCase()}` : `Dictar ${label.toLowerCase()} por voz`}
          disabled={!isAvailable}
          onPress={isListening ? stop : start}
          style={[styles.micButton, !isAvailable && styles.micButtonDisabled, isListening && styles.micButtonActive]}
        >
          <Text style={[styles.micButtonText, isListening && styles.micButtonTextActive]}>
            {isListening ? '⏹ Detener' : '🎤 Dictar'}
          </Text>
        </Pressable>
      </View>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        maxLength={maxLength}
        onFocus={onFocus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...typography.label, color: colors.textSecondary },
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  micButtonDisabled: { opacity: 0.4 },
  micButtonActive: { backgroundColor: colors.danger },
  micButtonText: { ...typography.label, color: colors.textPrimary },
  micButtonTextActive: { color: colors.textInverse },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
