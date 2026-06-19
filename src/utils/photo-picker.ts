import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export function promptPhotoSource(onPick: (source: 'camera' | 'gallery') => void): void {
  Alert.alert('Agregar foto', undefined, [
    { text: 'Tomar foto', onPress: () => onPick('camera') },
    { text: 'Elegir de galería', onPress: () => onPick('gallery') },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}

export async function pickPhotoUris(source: 'camera' | 'gallery'): Promise<string[]> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 1, allowsMultipleSelection: source === 'gallery' };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  return result.canceled ? [] : result.assets.map((asset) => asset.uri);
}
