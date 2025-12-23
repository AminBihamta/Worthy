import { endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear } from 'date-fns';

export type PeriodType = 'week' | 'month' | 'year';

export function getPeriodRange(date: Date, type: PeriodType): { start: number; end: number } {
  if (type === 'week') {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return { start: start.getTime(), end: end.getTime() };
  }
  if (type === 'year') {
    return {
      start: startOfYear(date).getTime(),
      end: endOfYear(date).getTime(),
    };
  }
  return {
    start: startOfMonth(date).getTime(),
    end: endOfMonth(date).getTime(),
  };
}
