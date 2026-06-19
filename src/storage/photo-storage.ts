import { Directory, File, Paths } from 'expo-file-system';

import { compressPhoto } from './photo-compression';
import type { CompressionPreset } from '../types/report';

function reportDirectory(reportId: string): Directory {
  return new Directory(Paths.document, 'reports', reportId);
}

export async function savePhotoToReport(
  reportId: string,
  sourceUri: string,
  photoIndex: number,
  preset: CompressionPreset
): Promise<{ fileName: string; localUri: string }> {
  const directory = reportDirectory(reportId);
  if (!directory.exists) {
    directory.create({ intermediates: true });
  }
  const compressedUri = await compressPhoto(sourceUri, preset);
  const fileName = `photo_${photoIndex}.jpg`;
  const destination = new File(directory, fileName);
  if (destination.exists) {
    destination.delete();
  }
  const compressedFile = new File(compressedUri);
  await compressedFile.copy(destination);
  return { fileName, localUri: destination.uri };
}

export function deletePhotoFile(localUri: string): void {
  const file = new File(localUri);
  if (file.exists) {
    file.delete();
  }
}

export function deleteReportDirectory(reportId: string): void {
  const directory = reportDirectory(reportId);
  if (directory.exists) {
    directory.delete();
  }
}
