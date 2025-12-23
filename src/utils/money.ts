const DEFAULT_CURRENCY = 'USD';

export function toMinor(amount: string | number): number {
  if (typeof amount === 'number') {
    return Math.round(amount * 100);
  }
  const normalized = amount.replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return Math.round(parsed * 100);
}

export function fromMinor(minor: number): number {
  return minor / 100;
}

export function formatMinor(minor: number, currency = DEFAULT_CURRENCY): string {
  const value = fromMinor(minor);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatSigned(minor: number, currency = DEFAULT_CURRENCY): string {
  const sign = minor < 0 ? '-' : '';
  return `${sign}${formatMinor(Math.abs(minor), currency)}`;
}
