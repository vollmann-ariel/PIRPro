import { Pressable, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ExportScreen } from '../screens/ExportScreen';
import { InspectionPickerScreen } from '../screens/InspectionPickerScreen';
import { NewProblemScreen } from '../screens/NewProblemScreen';
import { ProblemDetailScreen } from '../screens/ProblemDetailScreen';
import { ProblemListScreen } from '../screens/ProblemListScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme/tokens';

export type RootStackParamList = {
  InspectionPicker: undefined;
  ProblemList: { inspectionId: string };
  NewProblem: { inspectionId: string };
  ProblemDetail: { reportId: string };
  Export: { inspectionId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="InspectionPicker"
          component={InspectionPickerScreen}
          options={({ navigation }) => ({
            title: 'Inspecciones',
            headerRight: () => (
              <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Settings')}>
                <Text style={{ color: colors.primary }}>Ajustes</Text>
              </Pressable>
            ),
          })}
        />
        <Stack.Screen name="ProblemList" component={ProblemListScreen} options={{ title: 'Problemas' }} />
        <Stack.Screen name="NewProblem" component={NewProblemScreen} options={{ title: 'Nuevo problema' }} />
        <Stack.Screen name="ProblemDetail" component={ProblemDetailScreen} options={{ title: 'Detalle' }} />
        <Stack.Screen name="Export" component={ExportScreen} options={{ title: 'Exportar' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
