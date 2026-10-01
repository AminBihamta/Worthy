import { useCallback, useState } from 'react';
import {
  computeHomeWidgetSnapshot,
  type HomeWidgetSnapshot,
} from '../services/homeScreenWidgetSync';

export type WidgetStats = {
  loading: boolean;
  totalBalanceMinor: number;
  monthExpenseMinor: number;
  monthIncomeMinor: number;
  todaySpentMinor: number;
  monthLabel: string;
  currency: string;
  load: () => Promise<void>;
};

export function useWidgetStats(): WidgetStats {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<HomeWidgetSnapshot | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await computeHomeWidgetSnapshot();
      setSnapshot(next);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    totalBalanceMinor: snapshot?.balanceMinor ?? 0,
    monthExpenseMinor: snapshot?.monthExpenseMinor ?? 0,
    monthIncomeMinor: snapshot?.monthIncomeMinor ?? 0,
    todaySpentMinor: snapshot?.todaySpentMinor ?? 0,
    monthLabel: snapshot?.monthLabel ?? '',
    currency: snapshot?.currency ?? 'USD',
    load,
  };
}
