export type PhotoExifMetadata = {
  takenAt: string | null;
  latitude: number | null;
  longitude: number | null;
};

const NO_EXIF: PhotoExifMetadata = { takenAt: null, latitude: null, longitude: null };

/** EXIF DateTimeOriginal uses "YYYY:MM:DD HH:MM:SS" instead of ISO separators. */
function parseExifDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * GPS EXIF tags vary by source: expo-camera returns plain decimal degrees,
 * while gallery photos via expo-image-picker return raw [deg, min, sec] EXIF rationals.
 */
function parseExifGps(value: unknown, ref: unknown): number | null {
  let decimal: number | null = null;
  if (typeof value === 'number') {
    decimal = value;
  } else if (Array.isArray(value) && value.length === 3 && value.every((part) => typeof part === 'number')) {
    const [deg, min, sec] = value as number[];
    decimal = deg + min / 60 + sec / 3600;
  }
  if (decimal == null) return null;
  const refLetter = typeof ref === 'string' ? ref.toUpperCase() : null;
  return refLetter === 'S' || refLetter === 'W' ? -Math.abs(decimal) : Math.abs(decimal);
}

export function extractPhotoExif(exif: Record<string, unknown> | null | undefined): PhotoExifMetadata {
  if (!exif) return NO_EXIF;
  return {
    takenAt: parseExifDate(exif.DateTimeOriginal ?? exif.DateTime),
    latitude: parseExifGps(exif.GPSLatitude, exif.GPSLatitudeRef),
    longitude: parseExifGps(exif.GPSLongitude, exif.GPSLongitudeRef),
  };
}
