export function formatRRule(rruleText: string | null | undefined): string {
  if (!rruleText) return 'Not recurring';
  const parts = rruleText.split(';').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) {
      acc[key.trim().toUpperCase()] = value.trim().toUpperCase();
    }
    return acc;
  }, {});

  const freq = parts.FREQ;
  const interval = Number(parts.INTERVAL ?? '1');
  if (!freq) return 'Custom schedule';

  const baseLabel =
    freq === 'DAILY'
      ? 'day'
      : freq === 'WEEKLY'
        ? 'week'
        : freq === 'MONTHLY'
          ? 'month'
          : freq === 'YEARLY'
            ? 'year'
            : null;

  if (!baseLabel) return 'Custom schedule';

  if (!Number.isFinite(interval) || interval <= 1) {
    return `Every ${baseLabel}`;
  }

  return `Every ${interval} ${baseLabel}s`;
}
