import { useCallback, useState } from 'react';
import { endOfDay, format, startOfDay } from 'date-fns';
import { getExpenseTotals } from '../db/repositories/expenses';
import { getIncomeTotals } from '../db/repositories/incomes';
import { getPeriodRange } from '../utils/period';

export type WidgetStats = {
  loading: boolean;
  monthIncomeMinor: number;
  todaySpentMinor: number;
  monthLabel: string;
  load: () => Promise<void>;
};

export function useWidgetStats(): WidgetStats {
  const [loading, setLoading] = useState(true);
  const [monthIncomeMinor, setMonthIncomeMinor] = useState(0);
  const [todaySpentMinor, setTodaySpentMinor] = useState(0);
  const [monthLabel, setMonthLabel] = useState(() => format(new Date(), 'MMMM yyyy'));

  const load = useCallback(async () => {
    const now = new Date();
    const monthRange = getPeriodRange(now, 'month');
    const dayStart = startOfDay(now).getTime();
    const dayEnd = endOfDay(now).getTime();
    setLoading(true);
    try {
      const [income, spent] = await Promise.all([
        getIncomeTotals(monthRange.start, monthRange.end),
        getExpenseTotals(dayStart, dayEnd),
      ]);
      setMonthIncomeMinor(income);
      setTodaySpentMinor(spent);
      setMonthLabel(format(now, 'MMMM yyyy'));
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, monthIncomeMinor, todaySpentMinor, monthLabel, load };
}
