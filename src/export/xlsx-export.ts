import XLSX from 'xlsx';

import type { Inspection } from '../types/inspection';
import type { Report, ReportPhoto, ReportVideo } from '../types/report';

const BASE_HEADERS = [
  'Tipo de prueba',
  'VIN',
  'ID',
  'Fecha',
  'Título',
  'Severidad',
  'Planta de origen',
  'Horas',
  'PIR',
  'Repetitivo',
  'Informado por planta',
  'Tipo observación',
  'Ámbito',
  'Latitud',
  'Longitud',
  'Cant. fotos',
  'Cant. videos',
  'Modo de falla',
];

const BASE_COL_WIDTHS = [14, 18, 36, 20, 40, 10, 18, 8, 6, 12, 22, 16, 16, 12, 12, 12, 12, 50];

export function buildInspectionXlsx(
  inspection: Inspection,
  reports: Report[],
  photosByReportId: Map<string, ReportPhoto[]>,
  videosByReportId: Map<string, ReportVideo[]>,
  reportFolders: Map<string, string>
): Uint8Array {
  const maxPhotos = reports.reduce(
    (max, report) => Math.max(max, photosByReportId.get(report.id)?.length ?? 0),
    0
  );
  const maxVideos = reports.reduce(
    (max, report) => Math.max(max, videosByReportId.get(report.id)?.length ?? 0),
    0
  );
  const photoHeaders = Array.from({ length: maxPhotos }, (_, i) => `Foto ${i + 1}`);
  const videoHeaders = Array.from({ length: maxVideos }, (_, i) => `Video ${i + 1}`);
  const headers = [...BASE_HEADERS, ...photoHeaders, ...videoHeaders];

  const rows = reports.map((report) => {
    const photos = photosByReportId.get(report.id) ?? [];
    const videos = videosByReportId.get(report.id) ?? [];
    const folderName = reportFolders.get(report.id) ?? report.id;

    const photoCells = photos.map((_, i) => `${folderName}/foto_${i + 1}.jpg`);
    while (photoCells.length < maxPhotos) photoCells.push('');

    const videoCells = videos.map((_, i) => `${folderName}/video_${i + 1}.mp4`);
    while (videoCells.length < maxVideos) videoCells.push('');

    return [
      inspection.tipoPrueba,
      inspection.vin,
      report.id,
      report.createdAt,
      report.title,
      report.severity,
      report.plantOrigin,
      report.hours ?? '',
      report.isPir ? 'Sí' : 'No',
      report.isRepetitive ? 'Sí' : 'No',
      report.reportedByPlant ? 'Sí' : 'No',
      report.observationType ?? '',
      report.productScope ?? '',
      report.latitude ?? '',
      report.longitude ?? '',
      report.photoCount,
      report.videoCount,
      report.observations,
      ...photoCells,
      ...videoCells,
    ];
  });

  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Add hyperlinks to photo cells
  reports.forEach((report, rowIndex) => {
    const photos = photosByReportId.get(report.id) ?? [];
    const folderName = reportFolders.get(report.id) ?? report.id;
    photos.forEach((_, photoIndex) => {
      const col = BASE_HEADERS.length + photoIndex;
      const cellAddr = XLSX.utils.encode_cell({ r: rowIndex + 1, c: col });
      const target = `${folderName}/foto_${photoIndex + 1}.jpg`;
      if (ws[cellAddr]) {
        ws[cellAddr].l = { Target: target };
      }
    });
  });

  // Add hyperlinks to video cells
  reports.forEach((report, rowIndex) => {
    const videos = videosByReportId.get(report.id) ?? [];
    const folderName = reportFolders.get(report.id) ?? report.id;
    videos.forEach((_, videoIndex) => {
      const col = BASE_HEADERS.length + maxPhotos + videoIndex;
      const cellAddr = XLSX.utils.encode_cell({ r: rowIndex + 1, c: col });
      const target = `${folderName}/video_${videoIndex + 1}.mp4`;
      if (ws[cellAddr]) {
        ws[cellAddr].l = { Target: target };
      }
    });
  });

  const colWidths = [
    ...BASE_COL_WIDTHS,
    ...Array.from({ length: maxPhotos }, () => 50),
    ...Array.from({ length: maxVideos }, () => 50),
  ];
  ws['!cols'] = colWidths.map((wch) => ({ wch }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as number[]);
}
