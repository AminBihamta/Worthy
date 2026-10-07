import { differenceInCalendarDays, startOfDay } from 'date-fns';
import type { BudgetPeriodType } from '../db/repositories/budgets';
import { getPeriodRange } from './period';

export type BudgetAveragePeriod = 'off' | 'daily' | 'weekly' | 'monthly';

export function isBudgetAveragePeriodAllowed(
  budgetPeriod: BudgetPeriodType,
  averagePeriod: BudgetAveragePeriod,
): boolean {
  if (averagePeriod === 'off') return true;
  if (budgetPeriod === 'month') return averagePeriod === 'daily' || averagePeriod === 'weekly';
  if (budgetPeriod === 'week') return false;
  return averagePeriod === 'daily' || averagePeriod === 'weekly' || averagePeriod === 'monthly';
}

export function getBudgetAverageMinor(
  remainingMinor: number,
  budgetPeriod: BudgetPeriodType,
  averagePeriod: BudgetAveragePeriod,
  now = new Date(),
): number | null {
  if (!isBudgetAveragePeriodAllowed(budgetPeriod, averagePeriod) || averagePeriod === 'off') {
    return null;
  }

  const { end } = getPeriodRange(now, budgetPeriod);
  const remainingDays = Math.max(
    1,
    differenceInCalendarDays(new Date(end), startOfDay(now)) + 1,
  );
  const dailyMinor = remainingMinor / remainingDays;
  const multiplier =
    averagePeriod === 'daily' ? 1 : averagePeriod === 'weekly' ? 7 : 365.2425 / 12;

  return Math.round(dailyMinor * multiplier);
}

export function isCurrentBudgetPeriod(
  selectedDate: Date,
  budgetPeriod: BudgetPeriodType,
  now = new Date(),
): boolean {
  return (
    getPeriodRange(selectedDate, budgetPeriod).start ===
    getPeriodRange(now, budgetPeriod).start
  );
}
