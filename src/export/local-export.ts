import { zipSync } from 'fflate';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { buildInspectionXlsx } from './xlsx-export';
import { listPhotosByReport, listVideosByReport } from '../db/reports-repository';
import type { Inspection } from '../types/inspection';
import type { Report, ReportPhoto, ReportVideo } from '../types/report';

function reportFolderName(index: number, title: string): string {
  const num = String(index + 1).padStart(2, '0');
  const safe = title.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 40);
  return safe ? `obs_${num}_${safe}` : `obs_${num}`;
}

export async function exportInspectionLocally(inspection: Inspection, reports: Report[]): Promise<void> {
  const photosByReportId = new Map<string, ReportPhoto[]>();
  const videosByReportId = new Map<string, ReportVideo[]>();
  for (const report of reports) {
    photosByReportId.set(report.id, listPhotosByReport(report.id));
    videosByReportId.set(report.id, listVideosByReport(report.id));
  }

  const reportFolders = new Map<string, string>();
  reports.forEach((report, index) => {
    reportFolders.set(report.id, reportFolderName(index, report.title));
  });

  const xlsxBytes = buildInspectionXlsx(inspection, reports, photosByReportId, videosByReportId, reportFolders);
  const zipEntries: Record<string, Uint8Array> = {
    'reporte.xlsx': xlsxBytes,
  };

  for (const [reportId, photos] of photosByReportId) {
    const folderName = reportFolders.get(reportId) ?? reportId;
    photos.forEach((photo, photoIndex) => {
      const file = new File(photo.localUri);
      if (file.exists) {
        zipEntries[`${folderName}/foto_${photoIndex + 1}.jpg`] = file.bytesSync();
      }
    });
  }

  for (const [reportId, videos] of videosByReportId) {
    const folderName = reportFolders.get(reportId) ?? reportId;
    videos.forEach((video, videoIndex) => {
      const file = new File(video.localUri);
      if (file.exists) {
        zipEntries[`${folderName}/video_${videoIndex + 1}.mp4`] = file.bytesSync();
      }
    });
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
