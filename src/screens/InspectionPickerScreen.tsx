import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { createInspection, findSimilarInspection, listInspectionsByTipoPrueba, searchInspectionsByVin } from '../db/inspections-repository';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { TIPOS_PRUEBA, type Inspection, type TipoPrueba } from '../types/inspection';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'InspectionPicker'>;

export function InspectionPickerScreen({ navigation }: Props) {
  const [tipoPrueba, setTipoPrueba] = useState<TipoPrueba | null>(null);
  const [query, setQuery] = useState('');
  const [inspections, setInspections] = useState<Inspection[]>([]);

  useFocusEffect(
    useCallback(() => {
      setInspections(tipoPrueba ? listInspectionsByTipoPrueba(tipoPrueba) : []);
    }, [tipoPrueba])
  );

  const filtered = useMemo(() => {
    if (!tipoPrueba) return inspections;
    return searchInspectionsByVin(tipoPrueba, query);
  }, [tipoPrueba, inspections, query]);

  function openInspection(inspection: Inspection) {
    navigation.navigate('ProblemList', { inspectionId: inspection.id });
  }

  function handleCreate() {
    if (!tipoPrueba) return;
    const vin = query.trim();
    if (!vin) return;

    const similar = findSimilarInspection(tipoPrueba, vin);
    if (similar) {
      Alert.alert(
        'Reporte parecido encontrado',
        `Ya existe un reporte ${similar.tipoPrueba} con VIN "${similar.vin}". ¿Es el mismo?`,
        [
          { text: 'Usar ese', onPress: () => openInspection(similar) },
          {
            text: 'Crear nuevo',
            style: 'destructive',
            onPress: () => openInspection(createInspection(tipoPrueba, vin)),
          },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return;
    }
    openInspection(createInspection(tipoPrueba, vin));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tipo de prueba</Text>
      <View style={styles.chipRow}>
        {TIPOS_PRUEBA.map((tipo) => {
          const selected = tipo === tipoPrueba;
          return (
            <Pressable
              key={tipo}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setTipoPrueba(tipo)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{tipo}</Text>
            </Pressable>
          );
        })}
      </View>

      {tipoPrueba && (
        <>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="VIN del chasis (buscar o crear)"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <Pressable accessibilityRole="button" accessibilityLabel="Borrar VIN" style={styles.clearButton} onPress={() => setQuery('')}>
                <Text style={styles.clearButtonText}>×</Text>
              </Pressable>
            )}
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable style={styles.resultItem} onPress={() => openInspection(item)}>
                <Text style={styles.resultVin}>{item.vin}</Text>
                <Text style={styles.resultMeta}>Actualizado {new Date(item.lastActivityAt).toLocaleDateString()}</Text>
              </Pressable>
            )}
            ListFooterComponent={
              query.trim().length > 0 ? (
                <Pressable style={styles.createItem} onPress={handleCreate}>
                  <Text style={styles.createItemText}>+ Crear nuevo reporte con VIN: {query.trim()}</Text>
                </Pressable>
              ) : null
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.body, color: colors.textPrimary },
  chipTextSelected: { color: colors.textInverse },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: { fontSize: 18, lineHeight: 18, color: colors.textSecondary },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  resultItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultVin: { ...typography.subtitle, color: colors.textPrimary },
  resultMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  createItem: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  createItemText: { ...typography.body, color: colors.primary },
});
