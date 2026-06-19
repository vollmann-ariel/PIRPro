import { SegmentedSelector } from './SegmentedSelector';
import { colors } from '../theme/tokens';
import { SEVERITIES, type Severity } from '../types/report';

const SEVERITY_COLORS: Record<Severity, string> = {
  3: colors.severity3,
  6: colors.severity6,
  20: colors.severity20,
  50: colors.severity50,
};

type Props = {
  value: Severity | null;
  onChange: (severity: Severity) => void;
};

export function SeveritySelector({ value, onChange }: Props) {
  return (
    <SegmentedSelector
      label="Severidad"
      value={value}
      onChange={onChange}
      options={SEVERITIES.map((severity) => ({ value: severity, label: String(severity), color: SEVERITY_COLORS[severity] }))}
    />
  );
}
