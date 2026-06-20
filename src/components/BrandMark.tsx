import { Image, StyleSheet } from 'react-native';

const LOGO_SOURCE = require('../../assets/cnh-logo.png');
export const LOGO_HEIGHT = 36;
const { width: naturalWidth, height: naturalHeight } = Image.resolveAssetSource(LOGO_SOURCE);
const LOGO_WIDTH = LOGO_HEIGHT * (naturalWidth / naturalHeight);

export function BrandMark() {
  return <Image source={LOGO_SOURCE} style={styles.logo} resizeMode="contain" />;
}

const styles = StyleSheet.create({
  logo: { width: LOGO_WIDTH, height: LOGO_HEIGHT },
});
