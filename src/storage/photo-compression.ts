import { Image as ImageCompressor } from 'react-native-compressor';

import type { CompressionPreset } from '../types/report';

const PRESETS: Record<CompressionPreset, { maxSize: number; quality: number }> = {
  light: { maxSize: 1200, quality: 0.6 },
  medium: { maxSize: 1600, quality: 0.75 },
  high: { maxSize: 2400, quality: 0.9 },
};

/**
 * Uses react-native-compressor instead of expo-image-manipulator: the latter decodes the
 * full-resolution source bitmap before resizing (no inSampleSize), which OOM-crashes the
 * device on very high-megapixel photos. react-native-compressor's "auto" method downsamples
 * during decode.
 */
export async function compressPhoto(uri: string, preset: CompressionPreset): Promise<string> {
  const { maxSize, quality } = PRESETS[preset];
  return ImageCompressor.compress(uri, {
    compressionMethod: 'auto',
    maxWidth: maxSize,
    maxHeight: maxSize,
    quality,
    output: 'jpg',
  });
}
