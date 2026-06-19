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
};

export function DictationTextArea({ label, value, onChangeText, placeholder }: Props) {
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
          accessibilityLabel={`Dictar ${label.toLowerCase()} por voz`}
          disabled={!isAvailable}
          onPress={isListening ? stop : start}
          style={[styles.micButton, !isAvailable && styles.micButtonDisabled, isListening && styles.micButtonActive]}
        >
          <Text style={styles.micButtonText}>{isListening ? '● Grabando' : '🎤'}</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={4}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...typography.label, color: colors.textSecondary },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonDisabled: { opacity: 0.4 },
  micButtonActive: { backgroundColor: colors.dangerMuted },
  micButtonText: { fontSize: 14 },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 96,
    textAlignVertical: 'top',
    color: colors.textPrimary,
    ...typography.body,
  },
});
