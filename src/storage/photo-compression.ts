import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { CompressionPreset } from '../types/report';

const PRESETS: Record<CompressionPreset, { maxWidth: number; compress: number }> = {
  light: { maxWidth: 1200, compress: 0.6 },
  medium: { maxWidth: 1600, compress: 0.75 },
  high: { maxWidth: 2400, compress: 0.9 },
};

export async function compressPhoto(uri: string, preset: CompressionPreset): Promise<string> {
  const { maxWidth, compress } = PRESETS[preset];
  const context = ImageManipulator.manipulate(uri).resize({ width: maxWidth });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress, format: SaveFormat.JPEG });
  return result.uri;
}
