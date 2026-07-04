import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type PickedPhoto = { uri: string };

export function promptPhotoSource(onPick: (source: 'camera' | 'gallery') => void): void {
  Alert.alert('Agregar foto', undefined, [
    { text: 'Tomar foto', onPress: () => onPick('camera') },
    { text: 'Elegir de galería', onPress: () => onPick('gallery') },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}

export async function pickPhotoUris(source: 'camera' | 'gallery'): Promise<PickedPhoto[]> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'images',
    quality: 1,
    allowsMultipleSelection: source === 'gallery',
  };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return [];
  return result.assets.map((asset) => ({ uri: asset.uri }));
}

export function promptVideoSource(onPick: (source: 'camera' | 'gallery') => void): void {
  Alert.alert('Agregar video', undefined, [
    { text: 'Grabar video', onPress: () => onPick('camera') },
    { text: 'Elegir de galería', onPress: () => onPick('gallery') },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}

export async function pickVideoUri(source: 'camera' | 'gallery'): Promise<PickedPhoto | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'videos',
    allowsMultipleSelection: false,
  };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || result.assets.length === 0) return null;
  return { uri: result.assets[0].uri };
}
