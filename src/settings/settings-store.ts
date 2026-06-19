import { File, Paths } from 'expo-file-system';

import type { CompressionPreset } from '../types/report';

export type Settings = {
  userName: string;
  compressionPreset: CompressionPreset;
};

const DEFAULT_SETTINGS: Settings = { userName: '', compressionPreset: 'medium' };

function settingsFile(): File {
  return new File(Paths.document, 'settings.json');
}

export function loadSettings(): Settings {
  const file = settingsFile();
  if (!file.exists) {
    return DEFAULT_SETTINGS;
  }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(file.textSync()) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  const file = settingsFile();
  if (!file.exists) {
    file.create();
  }
  file.write(JSON.stringify(settings));
}
