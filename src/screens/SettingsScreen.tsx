import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { loadSettings, saveSettings } from '../settings/settings-store';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { CompressionPreset } from '../types/report';

const PRESET_LABELS: Record<CompressionPreset, string> = {
  light: 'Liviano',
  medium: 'Medio',
  high: 'Alta calidad',
};

export function SettingsScreen() {
  const [userName, setUserName] = useState('');
  const [compressionPreset, setCompressionPreset] = useState<CompressionPreset>('medium');

  useEffect(() => {
    const settings = loadSettings();
    setUserName(settings.userName);
    setCompressionPreset(settings.compressionPreset);
  }, []);

  function persist(next: { userName?: string; compressionPreset?: CompressionPreset }) {
    const updated = {
      userName: next.userName ?? userName,
      compressionPreset: next.compressionPreset ?? compressionPreset,
    };
    saveSettings(updated);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nombre de usuario</Text>
      <TextInput
        style={styles.input}
        value={userName}
        onChangeText={(text) => {
          setUserName(text);
          persist({ userName: text });
        }}
        placeholder="Tu nombre"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.label}>Calidad de fotos</Text>
      <View style={styles.row}>
        {(Object.keys(PRESET_LABELS) as CompressionPreset[]).map((preset) => {
          const selected = preset === compressionPreset;
          return (
            <Pressable
              key={preset}
              style={[styles.presetButton, selected && styles.presetButtonSelected]}
              onPress={() => {
                setCompressionPreset(preset);
                persist({ compressionPreset: preset });
              }}
            >
              <Text style={[styles.presetButtonText, selected && styles.presetButtonTextSelected]}>
                {PRESET_LABELS[preset]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.sm },
  label: { ...typography.label, color: colors.textSecondary, marginTop: spacing.md },
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
  row: { flexDirection: 'row', gap: spacing.sm },
  presetButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  presetButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetButtonText: { ...typography.body, color: colors.textPrimary },
  presetButtonTextSelected: { color: colors.textInverse },
});
