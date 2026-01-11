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

export function formatAmountInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const padded = digits.padStart(3, '0');
  const rawInteger = padded.slice(0, -2);
  const integerPart = rawInteger.replace(/^0+(?=\d)/, '') || '0';
  const decimalPart = padded.slice(-2);
  return `${integerPart}.${decimalPart}`;
}

export function formatMinorInput(minor: number): string {
  const safeMinor = Math.abs(Math.round(minor));
  return formatAmountInput(String(safeMinor));
}
