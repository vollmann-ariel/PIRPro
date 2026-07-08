import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BrandMark, LOGO_HEIGHT } from '../components/BrandMark';
import { ExportScreen } from '../screens/ExportScreen';
import { InspectionPickerScreen } from '../screens/InspectionPickerScreen';
import { NewProblemScreen } from '../screens/NewProblemScreen';
import { ProblemDetailScreen } from '../screens/ProblemDetailScreen';
import { ProblemListScreen } from '../screens/ProblemListScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors, spacing } from '../theme/tokens';

export type RootStackParamList = {
  InspectionPicker: undefined;
  ProblemList: { inspectionId: string };
  NewProblem: { inspectionId: string };
  ProblemDetail: { reportId: string; reportIds: string[]; slideFrom?: 'left' | 'none' };
  Export: { inspectionId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          headerLeft: () => (
            <View style={styles.headerLeft}>
              <BrandMark />
              <View style={styles.divider} />
              {navigation.canGoBack() && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Volver"
                  onPress={navigation.goBack}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.backButton}
                >
                  <View style={styles.backArrow} />
                </Pressable>
              )}
            </View>
          ),
        })}
      >
        <Stack.Screen
          name="InspectionPicker"
          component={InspectionPickerScreen}
          options={({ navigation }) => ({
            title: 'Reportes',
            headerRight: () => (
              <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Settings')}>
                <Text style={{ color: colors.primary }}>Ajustes</Text>
              </Pressable>
            ),
          })}
        />
        <Stack.Screen name="ProblemList" component={ProblemListScreen} options={{ title: 'Observaciones' }} />
        <Stack.Screen name="NewProblem" component={NewProblemScreen} options={{ title: 'Nueva observación' }} />
        <Stack.Screen
          name="ProblemDetail"
          component={ProblemDetailScreen}
          options={({ route }) => ({
            title: 'Resumen',
            animation: route.params.slideFrom === 'none' ? 'none' : route.params.slideFrom === 'left' ? 'slide_from_left' : 'slide_from_right',
          })}
        />
        <Stack.Screen name="Export" component={ExportScreen} options={{ title: 'Exportar' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginRight: spacing.xs },
  backButton: { width: 18, height: 28, alignItems: 'center', justifyContent: 'center' },
  backArrow: {
    width: 9,
    height: 9,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: colors.textPrimary,
    transform: [{ rotate: '45deg' }],
    marginLeft: 2,
  },
  divider: { width: 1, height: LOGO_HEIGHT * 0.8, backgroundColor: colors.textSecondary, marginLeft: spacing.xs },
});
