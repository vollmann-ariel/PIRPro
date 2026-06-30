import XLSX from 'xlsx';

import type { Inspection } from '../types/inspection';
import type { Report, ReportPhoto } from '../types/report';

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
  'Latitud',
  'Longitud',
  'Cant. fotos',
  'Modo de falla',
];

const BASE_COL_WIDTHS = [14, 18, 36, 20, 40, 10, 18, 8, 6, 12, 22, 16, 12, 12, 12, 50];

export function buildInspectionXlsx(
  inspection: Inspection,
  reports: Report[],
  photosByReportId: Map<string, ReportPhoto[]>,
  reportFolders: Map<string, string>
): Uint8Array {
  const maxPhotos = reports.reduce(
    (max, report) => Math.max(max, photosByReportId.get(report.id)?.length ?? 0),
    0
  );
  const photoHeaders = Array.from({ length: maxPhotos }, (_, i) => `Foto ${i + 1}`);
  const headers = [...BASE_HEADERS, ...photoHeaders];

  const rows = reports.map((report) => {
    const photos = photosByReportId.get(report.id) ?? [];
    const folderName = reportFolders.get(report.id) ?? report.id;
    const photoCells = photos.map((_, i) => `${folderName}/foto_${i + 1}.jpg`);
    while (photoCells.length < maxPhotos) photoCells.push('');

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
      report.latitude ?? '',
      report.longitude ?? '',
      report.photoCount,
      report.observations,
      ...photoCells,
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

  const colWidths = [
    ...BASE_COL_WIDTHS,
    ...Array.from({ length: maxPhotos }, () => 50),
  ];
  ws['!cols'] = colWidths.map((wch) => ({ wch }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}
