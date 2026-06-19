import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DescriptionField } from '../components/DescriptionField';
import { PhotoCaptureGrid } from '../components/PhotoCaptureGrid';
import { PlantOriginToggle } from '../components/PlantOriginToggle';
import { SeveritySelector } from '../components/SeveritySelector';
import {
  addPhotoToReport,
  deleteReportCompletely,
  getNextPhotoIndex,
  getReportById,
  listPhotosByReport,
  removePhotoFromReport,
  setReportPir,
  updateReport,
} from '../db/reports-repository';
import { loadSettings } from '../settings/settings-store';
import { savePhotoToReport } from '../storage/photo-storage';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { PlantOrigin, Report, ReportPhoto, Severity } from '../types/report';
import { confirmDestructive } from '../utils/confirm';
import { pickPhotoUris, promptPhotoSource } from '../utils/photo-picker';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProblemDetail'>;

const MIN_PHOTOS = 3;

export function ProblemDetailScreen({ route, navigation }: Props) {
  const { reportId } = route.params;
  const [report, setReport] = useState<Report | null>(null);
  const [photos, setPhotos] = useState<ReportPhoto[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [plantOrigin, setPlantOrigin] = useState<PlantOrigin | null>(null);

  const refresh = useCallback(() => {
    const current = getReportById(reportId);
    setReport(current);
    setPhotos(listPhotosByReport(reportId));
    if (current) {
      setDescription(current.description);
      setSeverity(current.severity);
      setPlantOrigin(current.plantOrigin);
    }
  }, [reportId]);

  useFocusEffect(refresh);

  if (!report) {
    return null;
  }

  function handleSaveEdit() {
    if (!severity || !plantOrigin) return;
    updateReport(reportId, { description, severity, plantOrigin });
    setIsEditing(false);
    refresh();
  }

  function handleTogglePir() {
    setReportPir(reportId, !report?.isPir);
    refresh();
  }

  function handleAddPhoto() {
    promptPhotoSource(async (source) => {
      const uris = await pickPhotoUris(source);
      if (uris.length === 0) return;
      const settings = loadSettings();
      let nextIndex = getNextPhotoIndex(reportId);
      for (const uri of uris) {
        const { fileName, localUri } = await savePhotoToReport(reportId, uri, nextIndex, settings.compressionPreset);
        addPhotoToReport(reportId, fileName, localUri);
        nextIndex += 1;
      }
      refresh();
    });
  }

  function handleRemovePhoto(index: number) {
    const photo = photos[index];
    if (!photo) return;
    confirmDestructive('Quitar foto', '¿Seguro que querés quitar esta foto del problema?', 'Quitar', () => {
      removePhotoFromReport(photo);
      refresh();
    });
  }

  function handleDelete() {
    confirmDestructive('Eliminar problema', 'Esta acción no se puede deshacer.', 'Eliminar', () => {
      deleteReportCompletely(reportId);
      navigation.goBack();
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PhotoCaptureGrid
        photos={photos.map((photo) => ({ uri: photo.localUri }))}
        minRequired={MIN_PHOTOS}
        editable={isEditing}
        onAddPress={handleAddPhoto}
        onRemove={handleRemovePhoto}
      />

      {isEditing ? (
        <>
          <Pressable style={styles.pirRow} accessibilityRole="checkbox" accessibilityState={{ checked: report.isPir }} onPress={handleTogglePir}>
            <View style={[styles.checkbox, report.isPir && styles.checkboxChecked]}>
              {report.isPir && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
            <Text style={styles.pirLabel}>Marcar como PIR (Product Incident Report)</Text>
          </Pressable>

          <DescriptionField value={description} onChangeText={setDescription} />
          <SeveritySelector value={severity} onChange={setSeverity} />
          <PlantOriginToggle value={plantOrigin} onChange={setPlantOrigin} />
          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setIsEditing(false)}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={handleSaveEdit}>
              <Text style={styles.primaryButtonText}>Guardar</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          {report.isPir && <Text style={styles.pirBadge}>PIR</Text>}
          <Text style={styles.description}>{report.description || '(sin descripción)'}</Text>
          <Text style={styles.meta}>Severidad {report.severity} · Planta {report.plantOrigin}</Text>
          <Text style={styles.meta}>{new Date(report.createdAt).toLocaleString()}</Text>
          {report.latitude != null && report.longitude != null && (
            <Text style={styles.meta}>
              GPS: {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
            </Text>
          )}
          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.secondaryButtonText}>Editar</Text>
            </Pressable>
            <Pressable style={styles.dangerButton} onPress={handleDelete}>
              <Text style={styles.dangerButtonText}>Eliminar</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  description: { ...typography.body, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  pirBadge: {
    ...typography.label,
    color: colors.danger,
    backgroundColor: colors.dangerMuted,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  pirRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxMark: { color: colors.textInverse, fontSize: 14, lineHeight: 14 },
  pirLabel: { ...typography.body, color: colors.textPrimary },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  primaryButton: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  primaryButtonText: { ...typography.subtitle, color: colors.textInverse },
  secondaryButton: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  secondaryButtonText: { ...typography.subtitle, color: colors.textPrimary },
  dangerButton: { flex: 1, backgroundColor: colors.dangerMuted, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  dangerButtonText: { ...typography.subtitle, color: colors.danger },
});
