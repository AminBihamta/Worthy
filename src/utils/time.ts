export function formatDate(dateTs: number): string {
  const date = new Date(dateTs);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatShortDate(dateTs: number): string {
  const date = new Date(dateTs);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(dateTs: number): string {
  const date = new Date(dateTs);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(dateTs: number): string {
  const date = new Date(dateTs);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysAgo(count: number): number {
  return Date.now() - count * 24 * 60 * 60 * 1000;
}
