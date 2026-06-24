import { DictationInput } from './DictationInput';
import { LabeledTextInput } from './LabeledTextInput';
import { PirCheckbox } from './PirCheckbox';
import { PlantOriginToggle } from './PlantOriginToggle';
import { SeveritySelector } from './SeveritySelector';
import type { PlantOrigin, Severity } from '../types/report';

type Props = {
  title: string;
  onTitleChange: (text: string) => void;
  severity: Severity | null;
  onSeverityChange: (severity: Severity) => void;
  isPir: boolean;
  onTogglePir: () => void;
  plantOrigin: PlantOrigin | null;
  onPlantOriginChange: (plant: PlantOrigin) => void;
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
  plantOrigin,
  onPlantOriginChange,
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
      <PlantOriginToggle value={plantOrigin} onChange={onPlantOriginChange} />
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
