import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { StackActions, useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getInspectionById } from '../db/inspections-repository';
import { deleteReportCompletely, listReportsByInspection } from '../db/reports-repository';
import { exportInspectionLocally } from '../export/local-export';
import { colors, elevation, radius, spacing, typography } from '../theme/tokens';
import { SEVERITY_COLORS, SEVERITY_LABELS } from '../theme/severity';
import type { Inspection } from '../types/inspection';
import type { Report } from '../types/report';
import { confirmDestructive } from '../utils/confirm';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProblemList'>;

export function ProblemListScreen({ route, navigation }: Props) {
  const { inspectionId } = route.params;
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSelecting = selectedIds.size > 0;

  const refresh = useCallback(() => {
    setInspection(getInspectionById(inspectionId));
    setReports(listReportsByInspection(inspectionId));
  }, [inspectionId]);

  useFocusEffect(refresh);

  useEffect(() => {
    if (!isSelecting) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelectedIds(new Set());
      return true;
    });
    return () => sub.remove();
  }, [isSelecting]);

  function handleRowPress(report: Report) {
    if (!isSelecting) {
      const reportIds = reports.map((r) => r.id);
      const index = reports.findIndex((r) => r.id === report.id);
      if (index > 0) {
        // Seed the previous screen silently so goBack() gives the native back animation on right swipe
        navigation.dispatch(StackActions.push('ProblemDetail', { reportId: reports[index - 1]!.id, reportIds, slideFrom: 'none' }));
      }
      navigation.navigate('ProblemDetail', { reportId: report.id, reportIds });
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(report.id)) {
        next.delete(report.id);
      } else {
        next.add(report.id);
      }
      return next;
    });
  }

  function handleRowLongPress(report: Report) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(report.id);
      return next;
    });
  }

  function handleExportSelected() {
    if (!inspection) return;
    const selected = reports.filter((r) => selectedIds.has(r.id));
    const isPartial = selected.length < reports.length;

    const doExport = () => {
      exportInspectionLocally(inspection, selected).then(() => {
        setSelectedIds(new Set());
      });
    };

    if (isPartial) {
      Alert.alert(
        'Exportación parcial',
        `Se exportarán ${selected.length} de ${reports.length} observaciones. El ZIP no incluirá las demás.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Exportar', onPress: doExport },
        ]
      );
    } else {
      doExport();
    }
  }

  function handleDeleteSelected() {
    const count = selectedIds.size;
    confirmDestructive(
      `Eliminar ${count} observación${count !== 1 ? 'es' : ''}`,
      'Esta acción no se puede deshacer.',
      'Eliminar',
      () => {
        for (const id of selectedIds) {
          deleteReportCompletely(id);
        }
        setSelectedIds(new Set());
        refresh();
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
      </View>

      <FlatList
        style={styles.flatList}
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const selected = selectedIds.has(item.id);
          return (
            <Pressable
              style={[styles.reportItem, selected && styles.reportItemSelected]}
              onPress={() => handleRowPress(item)}
              onLongPress={() => handleRowLongPress(item)}
            >
              <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[item.severity] }]}>
                <Text style={styles.severityBadgeText}>{SEVERITY_LABELS[item.severity]}</Text>
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle} numberOfLines={2}>
                  {item.title || '(sin título)'}
                </Text>
                <Text style={styles.reportMeta}>
                  {item.plantOrigin} · {new Date(item.createdAt).toLocaleString()} · {item.photoCount + item.videoCount} archivos
                  {item.isPir ? ' · PIR' : ''}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>Todavía no hay observaciones registradas.</Text>}
      />

      {!isSelecting && (
        <Pressable
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Agregar observación"
          onPress={() => navigation.navigate('NewProblem', { inspectionId })}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}

      {isSelecting && (
        <View style={styles.actionBar}>
          <Pressable style={styles.exportButton} onPress={handleExportSelected}>
            <Text style={styles.exportButtonText}>Exportar ({selectedIds.size})</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={handleDeleteSelected}>
            <Text style={styles.deleteButtonText}>Eliminar ({selectedIds.size})</Text>
          </Pressable>
        </View>
      )}
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
  flatList: { flex: 1 },
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
  reportItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
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
  actionBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  exportButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  exportButtonText: { ...typography.subtitle, color: colors.textPrimary },
  deleteButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerMuted,
    alignItems: 'center',
  },
  deleteButtonText: { ...typography.subtitle, color: colors.danger },
});
