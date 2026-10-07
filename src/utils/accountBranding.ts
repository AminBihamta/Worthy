export const WISE_ACCOUNT_BACKGROUND = '#9FE870';
export const WISE_ACCOUNT_BACKGROUND_END = '#5FAF2C';
export const WISE_ACCOUNT_FOREGROUND = '#0D1B2A';

export function isWiseAccountName(name: string): boolean {
  return name.trim().toLowerCase() === 'wise';
}
