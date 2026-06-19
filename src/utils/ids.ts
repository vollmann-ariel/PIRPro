import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';

let cachedDeviceId: string | null = null;

export function getDeviceId(): string {
  if (!cachedDeviceId) {
    cachedDeviceId = Application.getAndroidId() ?? Crypto.randomUUID();
  }
  return cachedDeviceId;
}

export function createId(): string {
  return Crypto.randomUUID();
}
