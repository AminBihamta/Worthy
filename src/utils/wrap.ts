import {
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  addMonths,
  addQuarters,
  addYears,
  subMonths,
  subQuarters,
  subWeeks,
  subYears,
} from 'date-fns';

export type WrapPeriod = 'week' | 'month' | 'quarter' | 'year';

const wrapPeriods: WrapPeriod[] = ['week', 'month', 'quarter', 'year'];

/**
 * Keeps Wrapped focused on periods the user has had time to build history for.
 * Week is always available so a new user can still explore Wrapped.
 */
export function getAvailableWrapPeriods(
  firstTransactionTs: number | null,
  reference = new Date(),
): WrapPeriod[] {
  if (!firstTransactionTs) return ['week'];

  const firstTransactionDate = new Date(firstTransactionTs);
  return wrapPeriods.filter((period) => {
    if (period === 'week') return true;

    const availableFrom =
      period === 'month'
        ? addMonths(firstTransactionDate, 1)
        : period === 'quarter'
          ? addQuarters(firstTransactionDate, 1)
          : addYears(firstTransactionDate, 1);

    return reference >= availableFrom;
  });
}

/**
 * Wrapped becomes available after the first Monday-Sunday week containing the
 * user's data has finished.
 */
export function hasCompletedWrapWeek(firstTransactionTs: number | null, reference = new Date()) {
  if (!firstTransactionTs) return false;

  return firstTransactionTs <= getWrapPeriodRange('week', reference).end;
}

export function getWrapPeriodRange(period: WrapPeriod, reference = new Date()) {
  if (period === 'week') {
    const target = subWeeks(reference, 1);
    return {
      start: startOfWeek(target, { weekStartsOn: 1 }).getTime(),
      end: endOfWeek(target, { weekStartsOn: 1 }).getTime(),
    };
  }
  if (period === 'quarter') {
    const target = subQuarters(reference, 1);
    return {
      start: startOfQuarter(target).getTime(),
      end: endOfQuarter(target).getTime(),
    };
  }
  if (period === 'year') {
    const target = subYears(reference, 1);
    return {
      start: startOfYear(target).getTime(),
      end: endOfYear(target).getTime(),
    };
  }
  const target = subMonths(reference, 1);
  return {
    start: startOfMonth(target).getTime(),
    end: endOfMonth(target).getTime(),
  };
}

export function formatWrapTitle(period: WrapPeriod, range: { start: number; end: number }) {
  const startDate = new Date(range.start);
  if (period === 'week') {
    return `Week of ${format(startDate, 'MMM d')}`;
  }
  if (period === 'quarter') {
    const quarter = Math.floor(startDate.getMonth() / 3) + 1;
    return `Q${quarter} ${format(startDate, 'yyyy')}`;
  }
  if (period === 'year') {
    return format(startDate, 'yyyy');
  }
  return format(startDate, 'MMMM yyyy');
}
