import { useEffect } from 'react';
import { BackHandler, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';
import { ZoomableImage } from './ZoomableImage';

export type PreviewPhoto = { uri: string; exifTakenAt?: string | null; latitude?: number | null; longitude?: number | null };

type Props = {
  photo: PreviewPhoto | null;
  onClose: () => void;
};

export function PhotoPreviewOverlay({ photo, onClose }: Props) {
  useEffect(() => {
    if (!photo) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [photo, onClose]);

  function handleOpenMap() {
    if (photo?.latitude == null || photo.longitude == null) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${photo.latitude},${photo.longitude}`);
  }

  if (!photo) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.backdrop} />
      <ZoomableImage uri={photo.uri} />

      <View style={styles.exifOverlay}>
        {photo.exifTakenAt && <Text style={styles.exifText}>📅 {new Date(photo.exifTakenAt).toLocaleString()}</Text>}
        {photo.latitude != null && photo.longitude != null && (
          <Pressable accessibilityRole="link" accessibilityLabel="Abrir ubicación en el mapa" onPress={handleOpenMap}>
            <Text style={[styles.exifText, styles.exifLink]}>
              🛰️ {photo.latitude.toFixed(5)}, {photo.longitude.toFixed(5)}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.background },
  exifOverlay: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
  exifText: { ...typography.caption, color: colors.textInverse },
  exifLink: { color: colors.primary, textDecorationLine: 'underline' },
});
