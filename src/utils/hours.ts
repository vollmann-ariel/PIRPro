export function parseHours(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatHours(hours: number | null): string {
  return hours == null ? '' : String(hours);
}
