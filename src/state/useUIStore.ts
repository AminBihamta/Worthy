import { create } from 'zustand';
import type { PeriodType } from '../utils/period';

interface UIState {
  insightsPeriod: PeriodType;
  setInsightsPeriod: (period: PeriodType) => void;
  budgetPeriod: PeriodType;
  setBudgetPeriod: (period: PeriodType) => void;
  transactionsPeriod: PeriodType;
  setTransactionsPeriod: (period: PeriodType) => void;
}

export const useUIStore = create<UIState>((set) => ({
  insightsPeriod: 'month',
  setInsightsPeriod: (period) => set({ insightsPeriod: period }),
  budgetPeriod: 'month',
  setBudgetPeriod: (period) => set({ budgetPeriod: period }),
  transactionsPeriod: 'month',
  setTransactionsPeriod: (period) => set({ transactionsPeriod: period }),
}));
