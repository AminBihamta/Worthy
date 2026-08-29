import { addDays, addMonths, endOfDay, endOfMonth, format, startOfDay, startOfMonth } from 'date-fns';

export type SeriesGranularity = 'day' | 'month';
export type TimeSeriesSourceRow = { date_ts: number; total_minor: number };
export type NormalizedTimeSeriesPoint = {
  x: number;
  y: number;
  label: string;
  hasData: boolean;
};

export function normalizeTimeSeries(
  rows: TimeSeriesSourceRow[],
  range: { start: number; end: number },
  granularity: SeriesGranularity,
): NormalizedTimeSeriesPoint[] {
  const start = granularity === 'month' ? startOfMonth(new Date(range.start)) : startOfDay(new Date(range.start));
  const end = granularity === 'month' ? startOfMonth(new Date(range.end)) : startOfDay(new Date(range.end));
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    const date = new Date(row.date_ts);
    const key = granularity === 'month' ? format(date, 'yyyy-MM') : format(date, 'yyyy-MM-dd');
    totals.set(key, (totals.get(key) ?? 0) + row.total_minor / 100);
  });

  const points: NormalizedTimeSeriesPoint[] = [];
  let cursor = start;
  while (cursor <= end) {
    const key = granularity === 'month' ? format(cursor, 'yyyy-MM') : format(cursor, 'yyyy-MM-dd');
    const hasData = totals.has(key);
    points.push({
      x: cursor.getTime(),
      y: totals.get(key) ?? 0,
      label: granularity === 'month' ? format(cursor, 'MMMM yyyy') : format(cursor, 'MMM d, yyyy'),
      hasData,
    });
    cursor = granularity === 'month' ? addMonths(cursor, 1) : addDays(cursor, 1);
  }
  return points;
}

export function getSeriesDomain(points: NormalizedTimeSeriesPoint[]) {
  const max = Math.max(...points.map((point) => point.y), 0);
  return { y: [0, max > 0 ? max * 1.15 : 1] as [number, number] };
}

export function getSeriesLabelRange(range: { start: number; end: number }, granularity: SeriesGranularity) {
  return granularity === 'month'
    ? `${format(startOfMonth(new Date(range.start)), 'MMM yyyy')} – ${format(endOfMonth(new Date(range.end)), 'MMM yyyy')}`
    : `${format(startOfDay(new Date(range.start)), 'MMM d')} – ${format(endOfDay(new Date(range.end)), 'MMM d')}`;
}
