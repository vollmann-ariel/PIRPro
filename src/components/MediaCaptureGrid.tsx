import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';

const MAX_VIDEOS = 3;
const TILE_SIZE = 96;

type Props = {
  photos: { uri: string }[];
  videos: { uri: string }[];
  minPhotos: number;
  editable?: boolean;
  showCounter?: boolean;
  onAddPhotoPress?: () => void;
  onAddVideoPress?: () => void;
  onRemovePhoto?: (index: number) => void;
  onRemoveVideo?: (index: number) => void;
  onPreviewPhoto?: (index: number) => void;
  onPreviewVideo?: (index: number) => void;
};

export function MediaCaptureGrid({
  photos,
  videos,
  minPhotos,
  editable = true,
  showCounter = true,
  onAddPhotoPress,
  onAddVideoPress,
  onRemovePhoto,
  onRemoveVideo,
  onPreviewPhoto,
  onPreviewVideo,
}: Props) {
  const canAddVideo = videos.length < MAX_VIDEOS;

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Fotos y videos</Text>
        {showCounter && (
          <Text style={styles.counter}>
            {photos.length} foto{photos.length !== 1 ? 's' : ''} · {minPhotos} mínimo
          </Text>
        )}
      </View>
      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <View key={photo.uri} style={styles.tileWrapper}>
            <Pressable
              accessibilityRole="imagebutton"
              accessibilityLabel={`Ver foto ${index + 1}`}
              disabled={!onPreviewPhoto}
              onPress={() => onPreviewPhoto?.(index)}
            >
              <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
            </Pressable>
            {editable && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar foto ${index + 1}`}
                style={styles.removeBadge}
                onPress={() => onRemovePhoto?.(index)}
              >
                <Text style={styles.removeBadgeText}>×</Text>
              </Pressable>
            )}
          </View>
        ))}

        {videos.map((video, index) => (
          <View key={video.uri} style={styles.tileWrapper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ver video ${index + 1}`}
              disabled={!onPreviewVideo}
              style={styles.videoTile}
              onPress={() => onPreviewVideo?.(index)}
            >
              <Text style={styles.playIcon}>▶</Text>
            </Pressable>
            {editable && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar video ${index + 1}`}
                style={styles.removeBadge}
                onPress={() => onRemoveVideo?.(index)}
              >
                <Text style={styles.removeBadgeText}>×</Text>
              </Pressable>
            )}
          </View>
        ))}

        {editable && (
          <>
            <Pressable accessibilityRole="button" accessibilityLabel="Agregar foto" style={styles.addTile} onPress={onAddPhotoPress}>
              <Text style={styles.addTileIcon}>📷</Text>
              <Text style={styles.addTileLabel}>Foto</Text>
            </Pressable>
            {canAddVideo && (
              <Pressable accessibilityRole="button" accessibilityLabel="Agregar video" style={styles.addTile} onPress={onAddVideoPress}>
                <Text style={styles.addTileIcon}>🎥</Text>
                <Text style={styles.addTileLabel}>Video</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  label: { ...typography.label, color: colors.textSecondary },
  counter: { ...typography.caption, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tileWrapper: { width: TILE_SIZE, height: TILE_SIZE },
  thumbnail: { width: TILE_SIZE, height: TILE_SIZE, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  videoTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  playIcon: { fontSize: 28 },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: { color: colors.textInverse, fontSize: 16, lineHeight: 16 },
  addTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addTileIcon: { fontSize: 24 },
  addTileLabel: { ...typography.caption, color: colors.textSecondary },
});
