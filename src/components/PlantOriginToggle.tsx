import { SegmentedSelector } from './SegmentedSelector';
import { colors } from '../theme/tokens';
import { PLANT_ORIGINS, type PlantOrigin } from '../types/report';

const PLANT_COLORS: Record<PlantOrigin, string> = {
  BR: colors.plantBR,
  AR: colors.plantAR,
};

type Props = {
  value: PlantOrigin | null;
  onChange: (plant: PlantOrigin) => void;
};

export function PlantOriginToggle({ value, onChange }: Props) {
  return (
    <SegmentedSelector
      label="Planta de origen"
      value={value}
      onChange={onChange}
      options={PLANT_ORIGINS.map((plant) => ({ value: plant, label: plant, color: PLANT_COLORS[plant] }))}
    />
  );
}
