import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { deleteInspectionRow, getInspectionById } from '../db/inspections-repository';
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

  function handleDeleteInspection() {
    confirmDestructive(
      'Eliminar reporte completo',
      `Se van a borrar las ${reports.length} observaciones registradas para este VIN. Esta acción no se puede deshacer. No se borra nada en OneDrive.`,
      'Eliminar todo',
      () => {
        for (const report of reports) {
          deleteReportCompletely(report.id);
        }
        deleteInspectionRow(inspectionId);
        navigation.goBack();
      }
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.tipoLabel}>{inspection?.tipoPrueba}</Text>
          <Text style={styles.title}>{inspection?.vin}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton} onPress={() => navigation.navigate('Export', { inspectionId })}>
            <Text style={styles.headerButtonText}>Exportar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Eliminar reporte completo"
            style={styles.deleteButton}
            onPress={handleDeleteInspection}
          >
            <Text style={styles.deleteButtonText}>🗑</Text>
          </Pressable>
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Eliminar observación"
              style={styles.deleteButton}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.deleteButtonText}>🗑</Text>
            </Pressable>
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
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  headerButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryMuted,
  },
  headerButtonText: { ...typography.label, color: colors.primary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
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
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerMuted,
  },
  deleteButtonText: { fontSize: 16 },
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
