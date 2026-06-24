import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/tokens';

type Photo = { uri: string; exifTakenAt?: string | null; latitude?: number | null; longitude?: number | null };

type Props = {
  photos: Photo[];
  minRequired: number;
  editable?: boolean;
  showCounter?: boolean;
  onAddPress?: () => void;
  onRemove?: (index: number) => void;
  onPreview?: (index: number) => void;
};

export function PhotoCaptureGrid({ photos, minRequired, editable = true, showCounter = true, onAddPress, onRemove, onPreview }: Props) {
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Fotos</Text>
        {showCounter && (
          <Text style={styles.counter}>
            {photos.length} / {minRequired} mínimo
          </Text>
        )}
      </View>
      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <View key={photo.uri} style={styles.thumbnailWrapper}>
            <Pressable accessibilityRole="imagebutton" accessibilityLabel={`Ver foto ${index + 1}`} disabled={!onPreview} onPress={() => onPreview?.(index)}>
              <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
            </Pressable>
            {editable && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar foto ${index + 1}`}
                style={styles.removeBadge}
                onPress={() => onRemove?.(index)}
              >
                <Text style={styles.removeBadgeText}>×</Text>
              </Pressable>
            )}
          </View>
        ))}
        {editable && (
          <Pressable accessibilityRole="button" accessibilityLabel="Agregar foto" style={styles.addTile} onPress={onAddPress}>
            <Text style={styles.addTileText}>+</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const TILE_SIZE = 96;

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  label: { ...typography.label, color: colors.textSecondary },
  counter: { ...typography.caption, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumbnailWrapper: { width: TILE_SIZE, height: TILE_SIZE },
  thumbnail: { width: TILE_SIZE, height: TILE_SIZE, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
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
  },
  addTileText: { fontSize: 32, color: colors.textSecondary },
});
