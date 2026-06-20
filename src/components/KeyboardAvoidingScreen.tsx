import { forwardRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export const KeyboardAvoidingScreen = forwardRef<ScrollView, Props>(function KeyboardAvoidingScreen(
  { children, style, contentContainerStyle },
  ref
) {
  return (
    <KeyboardAvoidingView style={[styles.flex, style]} behavior="padding">
      <ScrollView
        ref={ref}
        contentContainerStyle={[contentContainerStyle, styles.contentPadding]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contentPadding: { paddingBottom: Platform.OS === 'android' ? 240 : 120 },
});
