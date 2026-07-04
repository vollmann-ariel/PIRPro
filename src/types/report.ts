export const SEVERITIES = ['Obs', '3', '6', '20', '50', '100'] as const;
export type Severity = (typeof SEVERITIES)[number];

export type SyncStatus = 'local_only' | 'uploaded' | 'needs_reupload';
export type ObservationType = 'PAT' | 'SD' | 'OBS';
export type ProductScope = 'New Product' | 'Current Product';

export type Report = {
  id: string;
  inspectionId: string;
  title: string;
  observations: string;
  createdAt: string;
  severity: Severity;
  plantOrigin: string;
  hours: number | null;
  latitude: number | null;
  longitude: number | null;
  photoCount: number;
  videoCount: number;
  syncStatus: SyncStatus;
  isPir: boolean;
  isRepetitive: boolean;
  reportedByPlant: boolean;
  observationType: ObservationType | null;
  productScope: ProductScope | null;
};

export type ReportVideo = {
  id: string;
  reportId: string;
  fileName: string;
  localUri: string;
  recordedAt: string;
};

export type ReportPhoto = {
  id: string;
  reportId: string;
  fileName: string;
  localUri: string;
  takenAt: string;
  exifTakenAt: string | null;
  latitude: number | null;
  longitude: number | null;
  uploadedToOnedrive: boolean;
  pendingRemoteDelete: boolean;
};

export type CompressionPreset = 'light' | 'medium' | 'high';

export function hasRequiredObservationFields(
  title: string,
  observations: string,
  severity: Severity | null,
  plantOrigin: string | null
): boolean {
  return (
    title.trim().length > 0 &&
    observations.trim().length > 0 &&
    severity != null &&
    plantOrigin != null &&
    plantOrigin.trim().length > 0
  );
}
