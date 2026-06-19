import { zipSync } from 'fflate';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { buildInspectionCsv } from './csv-export';
import { listPhotosByReport } from '../db/reports-repository';
import type { Inspection } from '../types/inspection';
import type { Report, ReportPhoto } from '../types/report';

export async function exportInspectionLocally(inspection: Inspection, reports: Report[]): Promise<void> {
  const photosByReportId = new Map<string, ReportPhoto[]>();
  for (const report of reports) {
    photosByReportId.set(report.id, listPhotosByReport(report.id));
  }

  const csv = buildInspectionCsv(inspection, reports, photosByReportId);
  const zipEntries: Record<string, Uint8Array> = {
    'reporte.csv': new TextEncoder().encode(csv),
  };
  for (const [reportId, photos] of photosByReportId) {
    for (const photo of photos) {
      const file = new File(photo.localUri);
      if (file.exists) {
        zipEntries[`${reportId}/${photo.fileName}`] = file.bytesSync();
      }
    }
  }

  const zipped = zipSync(zipEntries);
  const exportsDirectory = new Directory(Paths.cache, 'exports');
  if (!exportsDirectory.exists) {
    exportsDirectory.create({ intermediates: true });
  }
  const zipFile = new File(exportsDirectory, `${inspection.tipoPrueba}_${inspection.vin}.zip`);
  if (zipFile.exists) {
    zipFile.delete();
  }
  zipFile.create();
  zipFile.write(zipped);

  await Sharing.shareAsync(zipFile.uri, {
    mimeType: 'application/zip',
    dialogTitle: `Reporte ${inspection.tipoPrueba} - ${inspection.vin}`,
  });
}
