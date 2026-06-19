export const SEVERITIES = [3, 6, 20, 50] as const;
export type Severity = (typeof SEVERITIES)[number];

export const PLANT_ORIGINS = ['BR', 'AR'] as const;
export type PlantOrigin = (typeof PLANT_ORIGINS)[number];

export type SyncStatus = 'local_only' | 'uploaded' | 'needs_reupload';

export type Report = {
  id: string;
  inspectionId: string;
  title: string;
  observations: string;
  createdAt: string;
  severity: Severity;
  plantOrigin: PlantOrigin;
  hours: number | null;
  latitude: number | null;
  longitude: number | null;
  photoCount: number;
  syncStatus: SyncStatus;
  isPir: boolean;
};

export type ReportPhoto = {
  id: string;
  reportId: string;
  fileName: string;
  localUri: string;
  takenAt: string;
  uploadedToOnedrive: boolean;
  pendingRemoteDelete: boolean;
};

export type CompressionPreset = 'light' | 'medium' | 'high';
