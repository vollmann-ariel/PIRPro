import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DictationInput } from '../components/DictationInput';
import { InAppCamera } from '../components/InAppCamera';
import { KeyboardAvoidingScreen } from '../components/KeyboardAvoidingScreen';
import { LabeledTextInput } from '../components/LabeledTextInput';
import { PhotoCaptureGrid } from '../components/PhotoCaptureGrid';
import { PirCheckbox } from '../components/PirCheckbox';
import { PlantOriginToggle } from '../components/PlantOriginToggle';
import { SeveritySelector } from '../components/SeveritySelector';
import { addPhotoToReport, createReport } from '../db/reports-repository';
import { captureGpsNonBlocking, type Coordinates } from '../location/gps-capture';
import { loadSettings } from '../settings/settings-store';
import { savePhotoToReport } from '../storage/photo-storage';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { PlantOrigin, Severity } from '../types/report';
import { parseHours } from '../utils/hours';
import { pickPhotoUris, promptPhotoSource } from '../utils/photo-picker';
import type { RootStackParamList } from '../navigation/AppNavigator';

const MIN_PHOTOS = 3;

type Props = NativeStackScreenProps<RootStackParamList, 'NewProblem'>;

export function NewProblemScreen({ route, navigation }: Props) {
  const { inspectionId } = route.params;
  const [title, setTitle] = useState('');
  const [observations, setObservations] = useState('');
  const [hoursText, setHoursText] = useState('');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [plantOrigin, setPlantOrigin] = useState<PlantOrigin | null>(null);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isPir, setIsPir] = useState(false);
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
      const uris = await pickPhotoUris(source);
      setPhotoUris((current) => [...current, ...uris]);
    });
  }

  function handleCapturePhoto(uri: string) {
    setPhotoUris((current) => [...current, uri]);
  }

  function handleRemovePhoto(index: number) {
    setPhotoUris((current) => current.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!title.trim() || !severity || !plantOrigin || photoUris.length < MIN_PHOTOS) {
      Alert.alert('Faltan datos', `Elegí un título, severidad, planta de origen, y al menos ${MIN_PHOTOS} fotos.`);
      return;
    }
    setIsSaving(true);
    try {
      const report = createReport({
        inspectionId,
        title: title.trim(),
        observations,
        severity,
        plantOrigin,
        hours: parseHours(hoursText),
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        isPir,
      });
      const settings = loadSettings();
      for (let index = 0; index < photoUris.length; index += 1) {
        const { fileName, localUri } = await savePhotoToReport(report.id, photoUris[index], index + 1, settings.compressionPreset);
        addPhotoToReport(report.id, fileName, localUri);
      }
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingScreen ref={scrollRef} style={styles.container} contentContainerStyle={styles.content}>
      <PhotoCaptureGrid photos={photoUris.map((uri) => ({ uri }))} minRequired={MIN_PHOTOS} onAddPress={handleAddPhoto} onRemove={handleRemovePhoto} />
      <InAppCamera
        visible={isCameraOpen}
        currentCount={photoUris.length}
        onCapture={handleCapturePhoto}
        onClose={() => setIsCameraOpen(false)}
      />

      <PirCheckbox value={isPir} onToggle={() => setIsPir((current) => !current)} />

      <DictationInput label="Título" value={title} onChangeText={setTitle} placeholder="Título breve de la observación" maxLength={80} />

      <View style={styles.field}>
        <SeveritySelector value={severity} onChange={setSeverity} />
      </View>

      <View style={styles.field}>
        <PlantOriginToggle value={plantOrigin} onChange={setPlantOrigin} />
      </View>

      <LabeledTextInput
        label="Horas"
        value={hoursText}
        onChangeText={setHoursText}
        placeholder="0"
        keyboardType="decimal-pad"
        onFocus={scrollToEnd}
      />

      <DictationInput
        label="Modo de Falla"
        value={observations}
        onChangeText={setObservations}
        placeholder="Modo de falla y notas adicionales"
        multiline
        onFocus={scrollToEnd}
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
  field: { gap: spacing.sm },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { ...typography.subtitle, color: colors.textInverse },
});
