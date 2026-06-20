import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getInspectionById } from '../db/inspections-repository';
import { deleteReportCompletely, listReportsByInspection } from '../db/reports-repository';
import { colors, elevation, radius, spacing, typography } from '../theme/tokens';
import type { Inspection } from '../types/inspection';
import type { Report, Severity } from '../types/report';
import { confirmDestructive } from '../utils/confirm';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProblemList'>;

const SEVERITY_COLORS: Record<Severity, string> = {
  3: colors.severity3,
  6: colors.severity6,
  20: colors.severity20,
  50: colors.severity50,
};

export function ProblemListScreen({ route, navigation }: Props) {
  const { inspectionId } = route.params;
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  const refresh = useCallback(() => {
    setInspection(getInspectionById(inspectionId));
    setReports(listReportsByInspection(inspectionId));
  }, [inspectionId]);

  useFocusEffect(refresh);

  function handleDelete(report: Report) {
    confirmDestructive('Eliminar observación', 'Esta acción no se puede deshacer. No se borra nada en OneDrive.', 'Eliminar', () => {
      deleteReportCompletely(report.id);
      refresh();
    });
  }

  function handleRowLongPress(report: Report) {
    Alert.alert(report.title || '(sin título)', undefined, [
      { text: 'Eliminar', style: 'destructive', onPress: () => handleDelete(report) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.tipoLabel}>{inspection?.tipoPrueba}</Text>
          <Text style={styles.title}>{inspection?.vin}</Text>
        </View>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.reportItem}
            onPress={() => navigation.navigate('ProblemDetail', { reportId: item.id })}
            onLongPress={() => handleRowLongPress(item)}
          >
            <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[item.severity] }]}>
              <Text style={styles.severityBadgeText}>{item.severity}</Text>
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle} numberOfLines={2}>
                {item.title || '(sin título)'}
              </Text>
              <Text style={styles.reportMeta}>
                {item.plantOrigin} · {new Date(item.createdAt).toLocaleString()} · {item.photoCount} fotos
                {item.isPir ? ' · PIR' : ''}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Todavía no hay observaciones registradas.</Text>}
      />

      <Pressable
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel="Agregar observación"
        onPress={() => navigation.navigate('NewProblem', { inspectionId })}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  titleBlock: { flexShrink: 1, marginRight: spacing.sm },
  tipoLabel: { ...typography.label, color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
  title: { ...typography.title, color: colors.textPrimary, fontSize: 18 },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  reportItem: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  severityBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityBadgeText: { color: colors.textInverse, fontWeight: '700' },
  reportInfo: { flex: 1 },
  reportTitle: { ...typography.body, color: colors.textPrimary },
  reportMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.level2,
  },
  fabText: { color: colors.textInverse, fontSize: 28, lineHeight: 28 },
});
