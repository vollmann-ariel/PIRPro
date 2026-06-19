export const TIPOS_PRUEBA = ['PAT', 'SD', 'PPV', 'Screening'] as const;
export type TipoPrueba = (typeof TIPOS_PRUEBA)[number];

export type Inspection = {
  id: string;
  tipoPrueba: TipoPrueba;
  vin: string;
  deviceId: string;
  createdAt: string;
  lastActivityAt: string;
  onedriveFolderItemId: string | null;
};
