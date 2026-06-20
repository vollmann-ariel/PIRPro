import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getInspectionById } from '../db/inspections-repository';
import { listReportsByInspection } from '../db/reports-repository';
import { exportInspectionLocally } from '../export/local-export';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { Inspection } from '../types/inspection';
import type { Report } from '../types/report';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Export'>;

export function ExportScreen({ route }: Props) {
  const { inspectionId } = route.params;
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setInspection(getInspectionById(inspectionId));
      setReports(listReportsByInspection(inspectionId));
    }, [inspectionId])
  );

  async function handleExport() {
    if (!inspection) return;
    setIsExporting(true);
    try {
      await exportInspectionLocally(inspection, reports);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {inspection?.tipoPrueba} — {inspection?.vin}
      </Text>
      <Text style={styles.meta}>{reports.length} observaciones registradas</Text>

      <Pressable style={[styles.button, isExporting && styles.buttonDisabled]} disabled={isExporting || reports.length === 0} onPress={handleExport}>
        <Text style={styles.buttonText}>{isExporting ? 'Generando…' : 'Exportar local (CSV + fotos)'}</Text>
      </Pressable>

      {reports.length === 0 && <Text style={styles.meta}>Agregá al menos una observación antes de exportar.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  title: { ...typography.title, color: colors.textPrimary },
  meta: { ...typography.body, color: colors.textSecondary },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.subtitle, color: colors.textInverse },
});
