import { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../theme/tokens';

type Props = {
  visible: boolean;
  currentCount: number;
  onCapture: (uri: string) => void;
  onClose: () => void;
};

export function InAppCamera({ visible, currentCount, onCapture, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!visible) setIsCameraReady(false);
  }, [visible]);

  async function handleShutterPress() {
    if (isCapturing || !isCameraReady) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (photo) onCapture(photo.uri);
    } finally {
      setIsCapturing(false);
    }
  }

  const isPermanentlyDenied = permission != null && !permission.granted && !permission.canAskAgain;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {visible &&
          (permission?.granted ? (
            <>
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setIsCameraReady(true)} />
              <View style={[styles.topRow, { top: insets.top + spacing.md }]}>
                <Text style={styles.counter}>{currentCount} fotos</Text>
              </View>
              <View style={[styles.bottomRow, { bottom: insets.bottom + spacing.lg }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sacar foto"
                  disabled={isCapturing || !isCameraReady}
                  onPress={handleShutterPress}
                  style={[styles.shutter, (isCapturing || !isCameraReady) && styles.shutterDisabled]}
                />
                <Pressable accessibilityRole="button" accessibilityLabel="Terminar de sacar fotos" style={styles.doneButton} onPress={onClose}>
                  <Text style={styles.doneButtonText}>Listo</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>
                {isPermanentlyDenied
                  ? 'PIRPro necesita acceso a la cámara. Habilitalo desde los ajustes del sistema.'
                  : 'PIRPro necesita acceso a la cámara para fotografiar la observación.'}
              </Text>
              <Pressable
                accessibilityRole="button"
                style={styles.permissionButton}
                onPress={() => (isPermanentlyDenied ? Linking.openSettings() : requestPermission())}
              >
                <Text style={styles.permissionButtonText}>{isPermanentlyDenied ? 'Abrir ajustes' : 'Dar permiso a la cámara'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.permissionCancel} onPress={onClose}>
                <Text style={styles.permissionCancelText}>Cancelar</Text>
              </Pressable>
            </View>
          ))}
      </View>
    </Modal>
  );
}

const SHUTTER_SIZE = 72;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topRow: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  counter: {
    ...typography.label,
    color: colors.textInverse,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  bottomRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  shutter: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: radius.pill,
    borderWidth: 4,
    borderColor: colors.textInverse,
    backgroundColor: colors.primary,
  },
  shutterDisabled: { opacity: 0.5 },
  doneButton: {
    position: 'absolute',
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  doneButtonText: { ...typography.subtitle, color: colors.textPrimary },
  permissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  permissionText: { ...typography.body, color: colors.textPrimary, textAlign: 'center' },
  permissionButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  permissionButtonText: { ...typography.subtitle, color: colors.textInverse },
  permissionCancel: { padding: spacing.sm },
  permissionCancelText: { ...typography.body, color: colors.textSecondary },
});
