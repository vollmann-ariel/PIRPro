export const colors = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#ECEEF1',
  border: '#D9DCE1',
  textPrimary: '#1A1D23',
  textSecondary: '#5B6270',
  textInverse: '#FFFFFF',
  primary: '#1F6FEB',
  primaryMuted: '#E3EDFC',
  danger: '#D1383D',
  dangerMuted: '#FBE7E8',
  success: '#1E8E5A',
  successMuted: '#E3F5EC',
  severity3: '#2E9E5B',
  severity6: '#D9A30B',
  severity20: '#E8742C',
  severity50: '#C62828',
  plantBR: '#2E9E5B',
  plantAR: '#1F6FEB',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const elevation = {
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const },
  subtitle: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
} as const;
