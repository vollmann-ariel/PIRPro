import { useCallback, useEffect, useState } from 'react';
import { ToastAndroid } from 'react-native';
import * as Network from 'expo-network';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

export function useVoiceDictation(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let mounted = true;
    Network.getNetworkStateAsync().then((state) => {
      if (mounted) setIsOnline(Boolean(state.isConnected && state.isInternetReachable));
    });
    const subscription = Network.addNetworkStateListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable));
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (event.isFinal && transcript) {
      onTranscript(transcript);
    }
  });

  useSpeechRecognitionEvent('error', () => {
    setIsListening(false);
    ToastAndroid.show('No se pudo reconocer la voz, escribí la descripción manualmente', ToastAndroid.SHORT);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  const start = useCallback(async () => {
    if (!isOnline) {
      ToastAndroid.show('El dictado por voz requiere conexión a internet', ToastAndroid.SHORT);
      return;
    }
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      ToastAndroid.show('Falta el permiso de micrófono', ToastAndroid.SHORT);
      return;
    }
    setIsListening(true);
    ExpoSpeechRecognitionModule.start({ lang: 'es-AR', interimResults: false, continuous: false });
  }, [isOnline]);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  return { isAvailable: isOnline, isListening, start, stop };
}
