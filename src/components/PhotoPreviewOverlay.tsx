import { useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import { colors } from '../theme/tokens';
import { ZoomableImage } from './ZoomableImage';

export type PreviewPhoto = { uri: string };

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

  if (!photo) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.backdrop} />
      <ZoomableImage uri={photo.uri} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.background },
});
