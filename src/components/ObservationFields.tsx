import { CheckboxField } from './CheckboxField';
import { DictationInput } from './DictationInput';
import { LabeledTextInput } from './LabeledTextInput';
import { PirCheckbox } from './PirCheckbox';
import { PlantOriginToggle } from './PlantOriginToggle';
import { SegmentedSelector } from './SegmentedSelector';
import { SeveritySelector } from './SeveritySelector';
import { colors } from '../theme/tokens';
import type { ObservationType, Severity } from '../types/report';

type Props = {
  title: string;
  onTitleChange: (text: string) => void;
  severity: Severity | null;
  onSeverityChange: (severity: Severity) => void;
  isPir: boolean;
  onTogglePir: () => void;
  isRepetitive: boolean;
  onToggleRepetitive: () => void;
  reportedByPlant: boolean;
  onToggleReportedByPlant: () => void;
  plantOrigin: string | null;
  onPlantOriginChange: (plant: string) => void;
  observationType: ObservationType | null;
  onObservationTypeChange: (type: ObservationType) => void;
  inspectionType: string | null;
  hoursText: string;
  onHoursChange: (text: string) => void;
  observations: string;
  onObservationsChange: (text: string) => void;
  onFieldFocus?: () => void;
};

export function ObservationFields({
  title,
  onTitleChange,
  severity,
  onSeverityChange,
  isPir,
  onTogglePir,
  isRepetitive,
  onToggleRepetitive,
  reportedByPlant,
  onToggleReportedByPlant,
  plantOrigin,
  onPlantOriginChange,
  observationType,
  onObservationTypeChange,
  inspectionType,
  hoursText,
  onHoursChange,
  observations,
  onObservationsChange,
  onFieldFocus,
}: Props) {
  const isObsSeverity = severity === 'Obs';

  function handleSeverityChange(nextSeverity: Severity) {
    onSeverityChange(nextSeverity);
    if (nextSeverity === 'Obs' && isPir) {
      onTogglePir();
    }
  }

  return (
    <>
      <DictationInput label="Título" value={title} onChangeText={onTitleChange} placeholder="Título breve de la observación" maxLength={80} />
      <SeveritySelector value={severity} onChange={handleSeverityChange} />
      <PirCheckbox value={!isObsSeverity && isPir} onToggle={onTogglePir} disabled={isObsSeverity} />
      <CheckboxField label="Problema repetitivo" value={isRepetitive} onToggle={onToggleRepetitive} />
      <CheckboxField label="Informado por planta" value={reportedByPlant} onToggle={onToggleReportedByPlant} />
      <PlantOriginToggle value={plantOrigin} onChange={onPlantOriginChange} />
      {inspectionType === 'PPV' && (
        <SegmentedSelector<ObservationType>
          label="Tipo de observación"
          value={observationType}
          onChange={onObservationTypeChange}
          options={[
            { value: 'PAT', label: 'PAT', color: colors.primary },
            { value: 'SD', label: 'SD', color: colors.primary },
          ]}
        />
      )}
      <LabeledTextInput
        label="Horas"
        value={hoursText}
        onChangeText={onHoursChange}
        placeholder="0"
        keyboardType="decimal-pad"
        onFocus={onFieldFocus}
      />
      <DictationInput
        label="Modo de Falla"
        value={observations}
        onChangeText={onObservationsChange}
        placeholder="Modo de falla y notas adicionales"
        multiline
        onFocus={onFieldFocus}
      />
    </>
  );
}
