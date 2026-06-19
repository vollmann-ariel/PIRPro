import { Image, StyleSheet } from 'react-native';

export function BrandMark() {
  return <Image source={require('../../assets/cnh-logo.png')} style={styles.logo} resizeMode="contain" />;
}

const styles = StyleSheet.create({
  logo: { width: 44, height: 52 },
});
