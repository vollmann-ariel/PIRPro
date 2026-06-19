import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from './src/components/BrandMark';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors, spacing } from './src/theme/tokens';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.brandBar}>
          <BrandMark />
        </SafeAreaView>
        <AppNavigator />
      </View>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  brandBar: { backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
});
