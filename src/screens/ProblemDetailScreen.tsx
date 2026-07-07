import { useCallback, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Linking, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { InAppCamera } from '../components/InAppCamera';
import { KeyboardAvoidingScreen } from '../components/KeyboardAvoidingScreen';
import { MediaCaptureGrid } from '../components/MediaCaptureGrid';
import { ObservationFields } from '../components/ObservationFields';
import { PhotoPreviewOverlay } from '../components/PhotoPreviewOverlay';
import { VideoPreviewOverlay } from '../components/VideoPreviewOverlay';
import { getInspectionById } from '../db/inspections-repository';
import {
  addPhotoToReport,
  addVideoToReport,
  deleteReportCompletely,
  getReportById,
  listPhotosByReport,
  listVideosByReport,
  removePhotoFromReport,
  removeVideoFromReport,
  setReportedByPlant,
  setReportObservationType,
  setReportPir,
  setReportProductScope,
  setReportRepetitive,
  updateReport,
} from '../db/reports-repository';
import { loadSettings } from '../settings/settings-store';
import { savePhotoToReport, saveVideoToReport } from '../storage/photo-storage';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { SEVERITY_LABELS } from '../theme/severity';
import { hasRequiredObservationFields, type ObservationType, type ProductScope, type Report, type ReportPhoto, type ReportVideo, type Severity } from '../types/report';
import { confirmDestructive } from '../utils/confirm';
import { formatHours, parseHours } from '../utils/hours';
import { pickPhotoUris, pickVideoUri, promptPhotoSource, promptVideoSource } from '../utils/photo-picker';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProblemDetail'>;

const MIN_PHOTOS = 3;
const MAX_VIDEOS = 3;

const SWIPE_THRESHOLD = 60;
const SCREEN_WIDTH = Dimensions.get('window').width;

export function ProblemDetailScreen({ route, navigation }: Props) {
  const { reportId, reportIds } = route.params;
  const [report, setReport] = useState<Report | null>(null);
  const [photos, setPhotos] = useState<ReportPhoto[]>([]);
  const [videos, setVideos] = useState<ReportVideo[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [inspectionType, setInspectionType] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [observations, setObservations] = useState('');
  const [hoursText, setHoursText] = useState('');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [plantOrigin, setPlantOrigin] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(null);
  const [previewVideoIndex, setPreviewVideoIndex] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const translateX = useRef(new Animated.Value(0)).current;

  const swipePan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5,
      onPanResponderMove: (_, { dx }) => {
        const currentIndex = reportIds?.indexOf(reportId) ?? -1;
        const atStart = currentIndex <= 0;
        const atEnd = currentIndex >= (reportIds?.length ?? 0) - 1;
        if ((dx > 0 && atStart) || (dx < 0 && atEnd)) {
          translateX.setValue(dx * 0.15);
        } else {
          translateX.setValue(dx);
        }
      },
      onPanResponderRelease: (_, { dx }) => {
        if (!reportIds || reportIds.length < 2) {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          return;
        }
        const currentIndex = reportIds.indexOf(reportId);
        if (dx > SWIPE_THRESHOLD && currentIndex > 0) {
          Animated.timing(translateX, { toValue: SCREEN_WIDTH, duration: 180, useNativeDriver: true }).start(() => {
            navigation.replace('ProblemDetail', { reportId: reportIds[currentIndex - 1]!, reportIds, slideFrom: 'none' });
          });
        } else if (dx < -SWIPE_THRESHOLD && currentIndex < reportIds.length - 1) {
          Animated.timing(translateX, { toValue: -SCREEN_WIDTH, duration: 180, useNativeDriver: true }).start(() => {
            navigation.replace('ProblemDetail', { reportId: reportIds[currentIndex + 1]!, reportIds, slideFrom: 'none' });
          });
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  function scrollToEnd() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }

  const refresh = useCallback(() => {
    const current = getReportById(reportId);
    setReport(current);
    setPhotos(listPhotosByReport(reportId));
    setVideos(listVideosByReport(reportId));
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

  function handleProductScopeChange(scope: ProductScope) {
    setReportProductScope(reportId, scope);
    setReport(getReportById(reportId));
  }

  function handleAddPhoto() {
    if (isProcessingMedia) return;
    promptPhotoSource(async (source) => {
      if (source === 'camera') {
        setIsCameraOpen(true);
        return;
      }
      const picked = await pickPhotoUris(source);
      if (picked.length === 0) return;
      setIsProcessingMedia(true);
      try {
        const settings = loadSettings();
        for (const { uri } of picked) {
          const { fileName, localUri } = await savePhotoToReport(reportId, uri, settings.compressionPreset);
          addPhotoToReport(reportId, fileName, localUri);
        }
        refresh();
      } finally {
        setIsProcessingMedia(false);
      }
    });
  }

  async function handleCapturePhoto(uri: string) {
    setIsProcessingMedia(true);
    try {
      const settings = loadSettings();
      const { fileName, localUri } = await savePhotoToReport(reportId, uri, settings.compressionPreset);
      addPhotoToReport(reportId, fileName, localUri);
      refresh();
    } finally {
      setIsProcessingMedia(false);
    }
  }

  function handleAddVideo() {
    if (isProcessingMedia || videos.length >= MAX_VIDEOS) return;
    promptVideoSource(async (source) => {
      const picked = await pickVideoUri(source);
      if (!picked) return;
      setIsProcessingMedia(true);
      try {
        const { fileName, localUri } = await saveVideoToReport(reportId, picked.uri);
        addVideoToReport(reportId, fileName, localUri);
        refresh();
      } finally {
        setIsProcessingMedia(false);
      }
    });
  }

  function handleRemovePhoto(index: number) {
    const photo = photos[index];
    if (!photo) return;
    confirmDestructive('Quitar foto', '¿Seguro que querés quitar esta foto de la observación?', 'Quitar', () => {
      removePhotoFromReport(photo);
      refresh();
    });
  }

  function handleRemoveVideo(index: number) {
    const video = videos[index];
    if (!video) return;
    confirmDestructive('Quitar video', '¿Seguro que querés quitar este video de la observación?', 'Quitar', () => {
      removeVideoFromReport(video);
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

  const previewPhotos = photos.map((photo) => ({ uri: photo.localUri }));
  const previewPhoto = previewPhotoIndex != null ? previewPhotos[previewPhotoIndex] ?? null : null;
  const previewVideoUri = previewVideoIndex != null ? (videos[previewVideoIndex]?.localUri ?? null) : null;

  return (
    <Animated.View style={[styles.flex, { transform: [{ translateX }] }]} {...swipePan.panHandlers}>
      <KeyboardAvoidingScreen ref={scrollRef} style={styles.container} contentContainerStyle={styles.content}>
        <MediaCaptureGrid
          photos={previewPhotos}
          videos={videos.map((v) => ({ uri: v.localUri }))}
          minPhotos={MIN_PHOTOS}
          editable={isEditing}
          showCounter={false}
          onAddPhotoPress={handleAddPhoto}
          onAddVideoPress={handleAddVideo}
          onRemovePhoto={handleRemovePhoto}
          onRemoveVideo={handleRemoveVideo}
          onPreviewPhoto={setPreviewPhotoIndex}
          onPreviewVideo={setPreviewVideoIndex}
        />
        {isProcessingMedia && <Text style={styles.processingText}>Procesando…</Text>}
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
              productScope={report.productScope}
              onProductScopeChange={handleProductScopeChange}
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

      <PhotoPreviewOverlay photo={previewPhoto} onClose={() => setPreviewPhotoIndex(null)} />
      <VideoPreviewOverlay uri={previewVideoUri} onClose={() => setPreviewVideoIndex(null)} />
    </Animated.View>
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
