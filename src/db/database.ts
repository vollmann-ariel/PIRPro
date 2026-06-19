import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

let db: SQLiteDatabase | null = null;

export function getDatabase(): SQLiteDatabase {
  if (!db) {
    db = openDatabaseSync('pirpro.db');
    db.execSync('PRAGMA journal_mode = WAL;');
    db.execSync(`
      CREATE TABLE IF NOT EXISTS inspections (
        id TEXT PRIMARY KEY NOT NULL,
        tipo_prueba TEXT NOT NULL CHECK (tipo_prueba IN ('PAT','SD','PPV','Screening')),
        vin TEXT NOT NULL,
        device_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_activity_at TEXT NOT NULL,
        onedrive_folder_item_id TEXT
      );

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY NOT NULL,
        inspection_id TEXT NOT NULL REFERENCES inspections(id),
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        severity INTEGER NOT NULL CHECK (severity IN (3,6,20,50)),
        plant_origin TEXT NOT NULL CHECK (plant_origin IN ('BR','AR')),
        latitude REAL,
        longitude REAL,
        photo_count INTEGER NOT NULL DEFAULT 0,
        sync_status TEXT NOT NULL DEFAULT 'local_only' CHECK (sync_status IN ('local_only','uploaded','needs_reupload')),
        is_pir INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS report_photos (
        id TEXT PRIMARY KEY NOT NULL,
        report_id TEXT NOT NULL REFERENCES reports(id),
        file_name TEXT NOT NULL,
        local_uri TEXT NOT NULL,
        taken_at TEXT NOT NULL,
        uploaded_to_onedrive INTEGER NOT NULL DEFAULT 0,
        pending_remote_delete INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_reports_inspection_id ON reports(inspection_id);
      CREATE INDEX IF NOT EXISTS idx_report_photos_report_id ON report_photos(report_id);
    `);
    runMigrations(db);
  }
  return db;
}

function runMigrations(database: SQLiteDatabase): void {
  const columns = database.getAllSync<{ name: string }>('PRAGMA table_info(reports)');
  const hasPirColumn = columns.some((column) => column.name === 'is_pir');
  if (!hasPirColumn) {
    database.execSync('ALTER TABLE reports ADD COLUMN is_pir INTEGER NOT NULL DEFAULT 0;');
  }
}
