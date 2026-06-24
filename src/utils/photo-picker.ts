import { Alert, PermissionsAndroid, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { extractPhotoExif, type PhotoExifMetadata } from './exif';

export type PickedPhoto = { uri: string; exif: PhotoExifMetadata };

export function promptPhotoSource(onPick: (source: 'camera' | 'gallery') => void): void {
  Alert.alert('Agregar foto', undefined, [
    { text: 'Tomar foto', onPress: () => onPick('camera') },
    { text: 'Elegir de galería', onPress: () => onPick('gallery') },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}

export async function pickPhotoUris(source: 'camera' | 'gallery'): Promise<PickedPhoto[]> {
  if (source === 'gallery' && Platform.OS === 'android') {
    // Android redacts GPS EXIF tags from gallery photos unless this permission is granted.
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_MEDIA_LOCATION);
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'images',
    quality: 1,
    allowsMultipleSelection: source === 'gallery',
    exif: true,
  };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return [];
  return result.assets.map((asset) => ({ uri: asset.uri, exif: extractPhotoExif(asset.exif ?? null) }));
}
