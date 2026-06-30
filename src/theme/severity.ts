import { colors } from './tokens';
import type { Severity } from '../types/report';

export const SEVERITY_COLORS: Record<Severity, string> = {
  Obs: colors.severityObs,
  '3': colors.severity3,
  '6': colors.severity6,
  '20': colors.severity20,
  '50': colors.severity50,
  '100': colors.severity100,
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  Obs: 'Obs.',
  '3': '3',
  '6': '6',
  '20': '20',
  '50': '50',
  '100': '100',
};
