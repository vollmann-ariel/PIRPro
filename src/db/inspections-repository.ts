import { distance } from 'fastest-levenshtein';

import { getDatabase } from './database';
import { getDeviceId } from '../utils/ids';
import { createId } from '../utils/ids';
import type { Inspection, TipoPrueba } from '../types/inspection';

type InspectionRow = {
  id: string;
  tipo_prueba: TipoPrueba;
  vin: string;
  device_id: string;
  created_at: string;
  last_activity_at: string;
  onedrive_folder_item_id: string | null;
};

function toInspection(row: InspectionRow): Inspection {
  return {
    id: row.id,
    tipoPrueba: row.tipo_prueba,
    vin: row.vin,
    deviceId: row.device_id,
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at,
    onedriveFolderItemId: row.onedrive_folder_item_id,
  };
}

export function listInspectionsByTipoPrueba(tipoPrueba: TipoPrueba): Inspection[] {
  const rows = getDatabase().getAllSync<InspectionRow>(
    'SELECT * FROM inspections WHERE tipo_prueba = ? ORDER BY last_activity_at DESC',
    tipoPrueba
  );
  return rows.map(toInspection);
}

export function getInspectionById(id: string): Inspection | null {
  const row = getDatabase().getFirstSync<InspectionRow>('SELECT * FROM inspections WHERE id = ?', id);
  return row ? toInspection(row) : null;
}

export function findSimilarInspection(tipoPrueba: TipoPrueba, vin: string): Inspection | null {
  const candidates = listInspectionsByTipoPrueba(tipoPrueba);
  const normalizedVin = vin.trim().toUpperCase();
  let closest: { inspection: Inspection; dist: number } | null = null;
  for (const candidate of candidates) {
    const dist = distance(normalizedVin, candidate.vin.trim().toUpperCase());
    if (dist > 0 && dist <= 3 && (!closest || dist < closest.dist)) {
      closest = { inspection: candidate, dist };
    }
  }
  return closest?.inspection ?? null;
}

export function createInspection(tipoPrueba: TipoPrueba, vin: string): Inspection {
  const now = new Date().toISOString();
  const inspection: Inspection = {
    id: createId(),
    tipoPrueba,
    vin: vin.trim(),
    deviceId: getDeviceId(),
    createdAt: now,
    lastActivityAt: now,
    onedriveFolderItemId: null,
  };
  getDatabase().runSync(
    `INSERT INTO inspections (id, tipo_prueba, vin, device_id, created_at, last_activity_at, onedrive_folder_item_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    inspection.id,
    inspection.tipoPrueba,
    inspection.vin,
    inspection.deviceId,
    inspection.createdAt,
    inspection.lastActivityAt,
    inspection.onedriveFolderItemId
  );
  return inspection;
}

export function touchInspection(id: string): void {
  getDatabase().runSync('UPDATE inspections SET last_activity_at = ? WHERE id = ?', new Date().toISOString(), id);
}

export function deleteInspectionRow(id: string): void {
  getDatabase().runSync('DELETE FROM inspections WHERE id = ?', id);
}
