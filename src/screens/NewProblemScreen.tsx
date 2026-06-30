import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { InAppCamera } from '../components/InAppCamera';
import { KeyboardAvoidingScreen } from '../components/KeyboardAvoidingScreen';
import { ObservationFields } from '../components/ObservationFields';
import { PhotoCaptureGrid } from '../components/PhotoCaptureGrid';
import { getInspectionById } from '../db/inspections-repository';
import { addPhotoToReport, createReport } from '../db/reports-repository';
import { captureGpsNonBlocking, type Coordinates } from '../location/gps-capture';
import { loadSettings } from '../settings/settings-store';
import { savePhotoToReport } from '../storage/photo-storage';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { hasRequiredObservationFields, type ObservationType, type Severity } from '../types/report';
import type { PhotoExifMetadata } from '../utils/exif';
import { parseHours } from '../utils/hours';
import { pickPhotoUris, promptPhotoSource } from '../utils/photo-picker';
import type { RootStackParamList } from '../navigation/AppNavigator';

const MIN_PHOTOS = 3;

type Props = NativeStackScreenProps<RootStackParamList, 'NewProblem'>;

export function NewProblemScreen({ route, navigation }: Props) {
  const { inspectionId } = route.params;
  const [tipoPrueba] = useState(() => getInspectionById(inspectionId)?.tipoPrueba ?? null);
  const [title, setTitle] = useState('');
  const [observations, setObservations] = useState('');
  const [hoursText, setHoursText] = useState('');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [plantOrigin, setPlantOrigin] = useState<string | null>(null);
  const [isPir, setIsPir] = useState(false);
  const [isRepetitive, setIsRepetitive] = useState(false);
  const [reportedByPlant, setReportedByPlant] = useState(false);
  const [observationType, setObservationType] = useState<ObservationType | null>(null);
  const [photos, setPhotos] = useState<{ uri: string; exif: PhotoExifMetadata }[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    captureGpsNonBlocking().then(setCoordinates);
  }, []);

  function scrollToEnd() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }

  function handleAddPhoto() {
    promptPhotoSource(async (source) => {
      if (source === 'camera') {
        setIsCameraOpen(true);
        return;
      }
      const picked = await pickPhotoUris(source);
      setPhotos((current) => [...current, ...picked]);
    });
  }

  function handleCapturePhoto(uri: string, exif: PhotoExifMetadata) {
    setPhotos((current) => [...current, { uri, exif }]);
  }

  function handleRemovePhoto(index: number) {
    setPhotos((current) => current.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (plantOrigin === '') {
      Alert.alert('Falta la planta de origen', 'Escribí el nombre de la planta de origen.');
      return;
    }
    const needsObservationType = tipoPrueba === 'PPV' && observationType == null;
    if (!hasRequiredObservationFields(title, observations, severity, plantOrigin) || photos.length < MIN_PHOTOS || needsObservationType) {
      Alert.alert('Faltan datos', `Completá el título, severidad, planta de origen, modo de falla${tipoPrueba === 'PPV' ? ', tipo PAT/SD' : ''} y al menos ${MIN_PHOTOS} fotos.`);
      return;
    }
    setIsSaving(true);
    try {
      const report = createReport({
        inspectionId,
        title: title.trim(),
        observations,
        severity: severity!,
        plantOrigin: plantOrigin!,
        hours: parseHours(hoursText),
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        isPir,
        isRepetitive,
        reportedByPlant,
        observationType: tipoPrueba === 'PPV' ? observationType : null,
      });
      const settings = loadSettings();
      for (let index = 0; index < photos.length; index += 1) {
        const { fileName, localUri } = await savePhotoToReport(report.id, photos[index].uri, index + 1, settings.compressionPreset);
        addPhotoToReport(report.id, fileName, localUri, photos[index].exif);
      }
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingScreen ref={scrollRef} style={styles.container} contentContainerStyle={styles.content}>
      <PhotoCaptureGrid photos={photos.map((p) => ({ uri: p.uri }))} minRequired={MIN_PHOTOS} onAddPress={handleAddPhoto} onRemove={handleRemovePhoto} />
      <InAppCamera
        visible={isCameraOpen}
        currentCount={photos.length}
        onCapture={handleCapturePhoto}
        onClose={() => setIsCameraOpen(false)}
      />

      <ObservationFields
        title={title}
        onTitleChange={setTitle}
        severity={severity}
        onSeverityChange={setSeverity}
        isPir={isPir}
        onTogglePir={() => setIsPir((current) => !current)}
        isRepetitive={isRepetitive}
        onToggleRepetitive={() => setIsRepetitive((current) => !current)}
        reportedByPlant={reportedByPlant}
        onToggleReportedByPlant={() => setReportedByPlant((current) => !current)}
        plantOrigin={plantOrigin}
        onPlantOriginChange={setPlantOrigin}
        observationType={observationType}
        onObservationTypeChange={setObservationType}
        inspectionType={tipoPrueba}
        hoursText={hoursText}
        onHoursChange={setHoursText}
        observations={observations}
        onObservationsChange={setObservations}
        onFieldFocus={scrollToEnd}
      />

      <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} disabled={isSaving} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{isSaving ? 'Guardando…' : 'Guardar observación'}</Text>
      </Pressable>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { ...typography.subtitle, color: colors.textInverse },
});
