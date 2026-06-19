import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DictationInput } from '../components/DictationInput';
import { KeyboardAvoidingScreen } from '../components/KeyboardAvoidingScreen';
import { LabeledTextInput } from '../components/LabeledTextInput';
import { PhotoCaptureGrid } from '../components/PhotoCaptureGrid';
import { PirCheckbox } from '../components/PirCheckbox';
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
import { formatHours, parseHours } from '../utils/hours';
import { pickPhotoUris, promptPhotoSource } from '../utils/photo-picker';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProblemDetail'>;

const MIN_PHOTOS = 3;

export function ProblemDetailScreen({ route, navigation }: Props) {
  const { reportId } = route.params;
  const [report, setReport] = useState<Report | null>(null);
  const [photos, setPhotos] = useState<ReportPhoto[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [observations, setObservations] = useState('');
  const [hoursText, setHoursText] = useState('');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [plantOrigin, setPlantOrigin] = useState<PlantOrigin | null>(null);

  const refresh = useCallback(() => {
    const current = getReportById(reportId);
    setReport(current);
    setPhotos(listPhotosByReport(reportId));
    if (current) {
      setTitle(current.title);
      setObservations(current.observations);
      setHoursText(formatHours(current.hours));
      setSeverity(current.severity);
      setPlantOrigin(current.plantOrigin);
    }
  }, [reportId]);

  useFocusEffect(refresh);

  if (!report) {
    return null;
  }

  function handleSaveEdit() {
    if (!title.trim() || !severity || !plantOrigin) return;
    updateReport(reportId, { title: title.trim(), observations, severity, plantOrigin, hours: parseHours(hoursText) });
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
    <KeyboardAvoidingScreen style={styles.container} contentContainerStyle={styles.content}>
      <PhotoCaptureGrid
        photos={photos.map((photo) => ({ uri: photo.localUri }))}
        minRequired={MIN_PHOTOS}
        editable={isEditing}
        onAddPress={handleAddPhoto}
        onRemove={handleRemovePhoto}
      />

      {isEditing ? (
        <>
          <PirCheckbox value={report.isPir} onToggle={handleTogglePir} />

          <DictationInput label="Título" value={title} onChangeText={setTitle} placeholder="Título breve del problema" maxLength={80} />
          <SeveritySelector value={severity} onChange={setSeverity} />
          <PlantOriginToggle value={plantOrigin} onChange={setPlantOrigin} />
          <LabeledTextInput label="Horas" value={hoursText} onChangeText={setHoursText} placeholder="0" keyboardType="decimal-pad" />
          <DictationInput label="Observaciones" value={observations} onChangeText={setObservations} placeholder="Observaciones adicionales" multiline />
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
          <Text style={styles.title}>{report.title || '(sin título)'}</Text>
          {report.observations ? <Text style={styles.observations}>{report.observations}</Text> : null}
          <Text style={styles.meta}>
            Severidad {report.severity} · Planta {report.plantOrigin}
            {report.hours != null ? ` · ${report.hours} h` : ''}
          </Text>
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
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { ...typography.title, color: colors.textPrimary },
  observations: { ...typography.body, color: colors.textSecondary },
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
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  primaryButton: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  primaryButtonText: { ...typography.subtitle, color: colors.textInverse },
  secondaryButton: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  secondaryButtonText: { ...typography.subtitle, color: colors.textPrimary },
  dangerButton: { flex: 1, backgroundColor: colors.dangerMuted, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  dangerButtonText: { ...typography.subtitle, color: colors.danger },
});
