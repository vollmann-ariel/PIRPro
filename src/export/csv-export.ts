import type { Inspection } from '../types/inspection';
import type { Report, ReportPhoto } from '../types/report';

const BASE_COLUMNS = [
  'tipo_prueba',
  'vin',
  'report_id',
  'created_at',
  'description',
  'severity',
  'plant_origin',
  'is_pir',
  'latitude',
  'longitude',
  'photo_count',
];

function escapeCsvValue(value: string | number | null): string {
  const text = value === null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildInspectionCsv(
  inspection: Inspection,
  reports: Report[],
  photosByReportId: Map<string, ReportPhoto[]>
): string {
  const maxPhotos = reports.reduce((max, report) => Math.max(max, photosByReportId.get(report.id)?.length ?? 0), 0);
  const photoColumns = Array.from({ length: maxPhotos }, (_, index) => `photo_${index + 1}`);
  const header = [...BASE_COLUMNS, ...photoColumns].join(',');

  const rows = reports.map((report) => {
    const photos = photosByReportId.get(report.id) ?? [];
    const photoPaths = photos.map((photo) => `${report.id}/${photo.fileName}`);
    const values = [
      inspection.tipoPrueba,
      inspection.vin,
      report.id,
      report.createdAt,
      report.description,
      report.severity,
      report.plantOrigin,
      report.isPir ? 'true' : 'false',
      report.latitude,
      report.longitude,
      report.photoCount,
      ...photoPaths,
    ];
    return values.map(escapeCsvValue).join(',');
  });

  return [header, ...rows].join('\n');
}
