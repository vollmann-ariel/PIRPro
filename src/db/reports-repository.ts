import { getDatabase } from './database';
import { touchInspection } from './inspections-repository';
import { deletePhotoFile, deleteReportDirectory } from '../storage/photo-storage';
import { createId } from '../utils/ids';
import type { PlantOrigin, Report, ReportPhoto, Severity, SyncStatus } from '../types/report';

type ReportRow = {
  id: string;
  inspection_id: string;
  title: string;
  observations: string;
  created_at: string;
  severity: Severity;
  plant_origin: PlantOrigin;
  hours: number | null;
  latitude: number | null;
  longitude: number | null;
  photo_count: number;
  sync_status: SyncStatus;
  is_pir: number;
};

type ReportPhotoRow = {
  id: string;
  report_id: string;
  file_name: string;
  local_uri: string;
  taken_at: string;
  uploaded_to_onedrive: number;
  pending_remote_delete: number;
};

function toReport(row: ReportRow): Report {
  return {
    id: row.id,
    inspectionId: row.inspection_id,
    title: row.title,
    observations: row.observations,
    createdAt: row.created_at,
    severity: row.severity,
    plantOrigin: row.plant_origin,
    hours: row.hours,
    latitude: row.latitude,
    longitude: row.longitude,
    photoCount: row.photo_count,
    syncStatus: row.sync_status,
    isPir: row.is_pir === 1,
  };
}

function toReportPhoto(row: ReportPhotoRow): ReportPhoto {
  return {
    id: row.id,
    reportId: row.report_id,
    fileName: row.file_name,
    localUri: row.local_uri,
    takenAt: row.taken_at,
    uploadedToOnedrive: row.uploaded_to_onedrive === 1,
    pendingRemoteDelete: row.pending_remote_delete === 1,
  };
}

export function listReportsByInspection(inspectionId: string): Report[] {
  const rows = getDatabase().getAllSync<ReportRow>(
    'SELECT * FROM reports WHERE inspection_id = ? ORDER BY created_at DESC',
    inspectionId
  );
  return rows.map(toReport);
}

export function getReportById(id: string): Report | null {
  const row = getDatabase().getFirstSync<ReportRow>('SELECT * FROM reports WHERE id = ?', id);
  return row ? toReport(row) : null;
}

export function listPhotosByReport(reportId: string): ReportPhoto[] {
  const rows = getDatabase().getAllSync<ReportPhotoRow>(
    'SELECT * FROM report_photos WHERE report_id = ? AND pending_remote_delete = 0 ORDER BY taken_at ASC',
    reportId
  );
  return rows.map(toReportPhoto);
}

export type NewReportInput = {
  inspectionId: string;
  title: string;
  observations: string;
  severity: Severity;
  plantOrigin: PlantOrigin;
  hours: number | null;
  latitude: number | null;
  longitude: number | null;
  isPir?: boolean;
};

export function createReport(input: NewReportInput): Report {
  const report: Report = {
    id: createId(),
    inspectionId: input.inspectionId,
    title: input.title,
    observations: input.observations,
    createdAt: new Date().toISOString(),
    severity: input.severity,
    plantOrigin: input.plantOrigin,
    hours: input.hours,
    latitude: input.latitude,
    longitude: input.longitude,
    photoCount: 0,
    syncStatus: 'local_only',
    isPir: input.isPir ?? false,
  };
  getDatabase().runSync(
    `INSERT INTO reports (id, inspection_id, title, observations, created_at, severity, plant_origin, hours, latitude, longitude, photo_count, sync_status, is_pir)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    report.id,
    report.inspectionId,
    report.title,
    report.observations,
    report.createdAt,
    report.severity,
    report.plantOrigin,
    report.hours,
    report.latitude,
    report.longitude,
    report.photoCount,
    report.syncStatus,
    report.isPir ? 1 : 0
  );
  touchInspection(report.inspectionId);
  return report;
}

export type ReportEditInput = {
  title: string;
  observations: string;
  severity: Severity;
  plantOrigin: PlantOrigin;
  hours: number | null;
};

export function updateReport(id: string, patch: ReportEditInput): void {
  const existing = getReportById(id);
  if (!existing) return;
  const nextSyncStatus: SyncStatus = existing.syncStatus === 'local_only' ? 'local_only' : 'needs_reupload';
  getDatabase().runSync(
    'UPDATE reports SET title = ?, observations = ?, severity = ?, plant_origin = ?, hours = ?, sync_status = ? WHERE id = ?',
    patch.title,
    patch.observations,
    patch.severity,
    patch.plantOrigin,
    patch.hours,
    nextSyncStatus,
    id
  );
}

export function setReportPir(id: string, isPir: boolean): void {
  const existing = getReportById(id);
  if (!existing) return;
  const nextSyncStatus: SyncStatus = existing.syncStatus === 'local_only' ? 'local_only' : 'needs_reupload';
  getDatabase().runSync(
    'UPDATE reports SET is_pir = ?, sync_status = ? WHERE id = ?',
    isPir ? 1 : 0,
    nextSyncStatus,
    id
  );
}

export function getNextPhotoIndex(reportId: string): number {
  const rows = getDatabase().getAllSync<{ file_name: string }>(
    'SELECT file_name FROM report_photos WHERE report_id = ?',
    reportId
  );
  let max = 0;
  for (const row of rows) {
    const match = /^photo_(\d+)\.jpg$/.exec(row.file_name);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return max + 1;
}

export function deleteReport(id: string): void {
  getDatabase().runSync('DELETE FROM report_photos WHERE report_id = ?', id);
  getDatabase().runSync('DELETE FROM reports WHERE id = ?', id);
}

export function deleteReportCompletely(id: string): void {
  deleteReport(id);
  deleteReportDirectory(id);
}

export function addPhotoToReport(reportId: string, fileName: string, localUri: string): ReportPhoto {
  const photo: ReportPhoto = {
    id: createId(),
    reportId,
    fileName,
    localUri,
    takenAt: new Date().toISOString(),
    uploadedToOnedrive: false,
    pendingRemoteDelete: false,
  };
  getDatabase().runSync(
    'INSERT INTO report_photos (id, report_id, file_name, local_uri, taken_at, uploaded_to_onedrive, pending_remote_delete) VALUES (?, ?, ?, ?, ?, 0, 0)',
    photo.id,
    photo.reportId,
    photo.fileName,
    photo.localUri,
    photo.takenAt
  );
  getDatabase().runSync(
    'UPDATE reports SET photo_count = photo_count + 1 WHERE id = ?',
    reportId
  );
  return photo;
}

export function removePhotoFromReport(photo: ReportPhoto): void {
  if (photo.uploadedToOnedrive) {
    getDatabase().runSync('UPDATE report_photos SET pending_remote_delete = 1 WHERE id = ?', photo.id);
  } else {
    getDatabase().runSync('DELETE FROM report_photos WHERE id = ?', photo.id);
    deletePhotoFile(photo.localUri);
  }
  getDatabase().runSync('UPDATE reports SET photo_count = photo_count - 1 WHERE id = ?', photo.reportId);
}
