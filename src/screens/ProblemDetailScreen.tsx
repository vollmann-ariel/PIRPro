import { useCallback, useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { InAppCamera } from '../components/InAppCamera';
import { KeyboardAvoidingScreen } from '../components/KeyboardAvoidingScreen';
import { ObservationFields } from '../components/ObservationFields';
import { PhotoCaptureGrid } from '../components/PhotoCaptureGrid';
import { PhotoPreviewOverlay } from '../components/PhotoPreviewOverlay';
import { getInspectionById } from '../db/inspections-repository';
import {
  addPhotoToReport,
  deleteReportCompletely,
  getNextPhotoIndex,
  getReportById,
  listPhotosByReport,
  removePhotoFromReport,
  setReportedByPlant,
  setReportObservationType,
  setReportPir,
  setReportRepetitive,
  updateReport,
} from '../db/reports-repository';
import { loadSettings } from '../settings/settings-store';
import { savePhotoToReport } from '../storage/photo-storage';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { SEVERITY_LABELS } from '../theme/severity';
import { hasRequiredObservationFields, type ObservationType, type Report, type ReportPhoto, type Severity } from '../types/report';
import { confirmDestructive } from '../utils/confirm';
import type { PhotoExifMetadata } from '../utils/exif';
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
  const [inspectionType, setInspectionType] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [observations, setObservations] = useState('');
  const [hoursText, setHoursText] = useState('');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [plantOrigin, setPlantOrigin] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  function scrollToEnd() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }

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
      setInspectionType(getInspectionById(current.inspectionId)?.tipoPrueba ?? null);
    }
  }, [reportId]);

  useFocusEffect(refresh);

  if (!report) {
    return null;
  }

  function handleSaveEdit() {
    if (plantOrigin === '') {
      Alert.alert('Falta la planta de origen', 'Escribí el nombre de la planta de origen.');
      return;
    }
    if (!hasRequiredObservationFields(title, observations, severity, plantOrigin)) {
      Alert.alert('Faltan datos', 'Completá el título, severidad, planta de origen y modo de falla.');
      return;
    }
    if (inspectionType === 'PPV' && report?.observationType == null) {
      Alert.alert('Falta el tipo', 'Elegí PAT o SD para esta observación PPV.');
      return;
    }
    updateReport(reportId, { title: title.trim(), observations, severity: severity!, plantOrigin: plantOrigin!, hours: parseHours(hoursText) });
    setIsEditing(false);
    refresh();
  }

  function handleTogglePir() {
    if (!report) return;
    setReportPir(reportId, !report.isPir);
    setReport(getReportById(reportId));
  }

  function handleToggleRepetitive() {
    if (!report) return;
    setReportRepetitive(reportId, !report.isRepetitive);
    setReport(getReportById(reportId));
  }

  function handleToggleReportedByPlant() {
    if (!report) return;
    setReportedByPlant(reportId, !report.reportedByPlant);
    setReport(getReportById(reportId));
  }

  function handleObservationTypeChange(type: ObservationType) {
    setReportObservationType(reportId, type);
    setReport(getReportById(reportId));
  }

  function handleAddPhoto() {
    if (isProcessingPhoto) return;
    promptPhotoSource(async (source) => {
      if (source === 'camera') {
        setIsCameraOpen(true);
        return;
      }
      const picked = await pickPhotoUris(source);
      if (picked.length === 0) return;
      setIsProcessingPhoto(true);
      try {
        const settings = loadSettings();
        let nextIndex = getNextPhotoIndex(reportId);
        for (const { uri, exif } of picked) {
          const { fileName, localUri } = await savePhotoToReport(reportId, uri, nextIndex, settings.compressionPreset);
          addPhotoToReport(reportId, fileName, localUri, exif);
          nextIndex += 1;
        }
        refresh();
      } finally {
        setIsProcessingPhoto(false);
      }
    });
  }

  async function handleCapturePhoto(uri: string, exif: PhotoExifMetadata) {
    setIsProcessingPhoto(true);
    try {
      const settings = loadSettings();
      const nextIndex = getNextPhotoIndex(reportId);
      const { fileName, localUri } = await savePhotoToReport(reportId, uri, nextIndex, settings.compressionPreset);
      addPhotoToReport(reportId, fileName, localUri, exif);
      refresh();
    } finally {
      setIsProcessingPhoto(false);
    }
  }

  function handleClosePreview() {
    setPreviewIndex(null);
  }

  function handleRemovePhoto(index: number) {
    const photo = photos[index];
    if (!photo) return;
    confirmDestructive('Quitar foto', '¿Seguro que querés quitar esta foto de la observación?', 'Quitar', () => {
      removePhotoFromReport(photo);
      refresh();
    });
  }

  function handleOpenMap() {
    if (report?.latitude == null || report.longitude == null) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`);
  }

  function handleDelete() {
    confirmDestructive('Eliminar observación', 'Esta acción no se puede deshacer.', 'Eliminar', () => {
      deleteReportCompletely(reportId);
      navigation.goBack();
    });
  }

  const previewPhotos = photos.map((photo) => ({
    uri: photo.localUri,
    exifTakenAt: photo.exifTakenAt,
    latitude: photo.latitude,
    longitude: photo.longitude,
  }));
  const previewPhoto = previewIndex != null ? previewPhotos[previewIndex] ?? null : null;

  return (
    <View style={styles.flex}>
      <KeyboardAvoidingScreen ref={scrollRef} style={styles.container} contentContainerStyle={styles.content}>
      <PhotoCaptureGrid
        photos={previewPhotos}
        minRequired={MIN_PHOTOS}
        editable={isEditing}
        showCounter={false}
        onAddPress={handleAddPhoto}
        onRemove={handleRemovePhoto}
        onPreview={setPreviewIndex}
      />
      {isProcessingPhoto && <Text style={styles.processingText}>Procesando foto…</Text>}
      <InAppCamera
        visible={isCameraOpen}
        currentCount={photos.length}
        onCapture={handleCapturePhoto}
        onClose={() => setIsCameraOpen(false)}
      />

      {isEditing ? (
        <>
          <ObservationFields
            title={title}
            onTitleChange={setTitle}
            severity={severity}
            onSeverityChange={setSeverity}
            isPir={report.isPir}
            onTogglePir={handleTogglePir}
            isRepetitive={report.isRepetitive}
            onToggleRepetitive={handleToggleRepetitive}
            reportedByPlant={report.reportedByPlant}
            onToggleReportedByPlant={handleToggleReportedByPlant}
            plantOrigin={plantOrigin}
            onPlantOriginChange={setPlantOrigin}
            observationType={report.observationType}
            onObservationTypeChange={handleObservationTypeChange}
            inspectionType={inspectionType}
            hoursText={hoursText}
            onHoursChange={setHoursText}
            observations={observations}
            onObservationsChange={setObservations}
            onFieldFocus={scrollToEnd}
          />
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
            Severidad {SEVERITY_LABELS[report.severity]} · Planta {report.plantOrigin}
            {report.hours != null ? ` · ${report.hours} h` : ''}
            {report.observationType ? ` · ${report.observationType}` : ''}
          </Text>
          {(report.isRepetitive || report.reportedByPlant) && (
            <Text style={styles.meta}>
              {[
                report.isRepetitive ? 'Repetitivo' : null,
                report.reportedByPlant ? 'Informado por planta' : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          )}
          <Text style={styles.meta}>📅 {new Date(report.createdAt).toLocaleString()}</Text>
          {report.latitude != null && report.longitude != null && (
            <Pressable accessibilityRole="link" accessibilityLabel="Abrir ubicación en el mapa" onPress={handleOpenMap}>
              <Text style={styles.gpsLink}>
                🛰️ GPS: {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
              </Text>
            </Pressable>
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

      <PhotoPreviewOverlay photo={previewPhoto} onClose={handleClosePreview} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { ...typography.title, color: colors.textPrimary },
  observations: { ...typography.body, color: colors.textSecondary },
  processingText: { ...typography.caption, color: colors.textSecondary },
  meta: { ...typography.caption, color: colors.textSecondary },
  gpsLink: { ...typography.caption, color: colors.primary, textDecorationLine: 'underline' },
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
