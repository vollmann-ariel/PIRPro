import { SegmentedSelector } from './SegmentedSelector';
import { SEVERITY_COLORS, SEVERITY_LABELS } from '../theme/severity';
import { SEVERITIES, type Severity } from '../types/report';

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
      options={SEVERITIES.map((severity) => ({ value: severity, label: SEVERITY_LABELS[severity], color: SEVERITY_COLORS[severity] }))}
    />
  );
}
