import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import { colors, spacing, typography } from '../theme/tokens';

type Props = {
  uri: string | null;
  onClose: () => void;
};

export function VideoPreviewOverlay({ uri, onClose }: Props) {
  const player = useVideoPlayer(uri ?? '', (p) => {
    p.loop = true;
    if (uri) p.play();
  });

  return (
    <Modal visible={uri != null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {uri != null && (
          <VideoView style={styles.video} player={player} fullscreenOptions={{ enable: true }} allowsPictureInPicture />
        )}
        <Pressable style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Cerrar video" onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  video: { width: '100%', aspectRatio: 16 / 9 },
  closeButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    padding: spacing.sm,
  },
  closeText: { ...typography.title, color: colors.textPrimary },
});
