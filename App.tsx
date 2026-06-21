import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConfirmDialogHost } from './src/components/ConfirmDialog';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
      <ConfirmDialogHost />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
