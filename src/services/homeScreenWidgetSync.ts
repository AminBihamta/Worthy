import { format } from 'date-fns';
import { Platform } from 'react-native';

import { listAccountsWithBalances } from '../db/repositories/accounts';
import { listCurrencies } from '../db/repositories/currencies';
import { getExpenseTotals } from '../db/repositories/expenses';
import { getIncomeTotals } from '../db/repositories/incomes';
import { useSettingsStore } from '../state/useSettingsStore';
import { buildRateMap, convertMinorToBase } from '../utils/currency';
import { formatSigned } from '../utils/money';
import { getPeriodRange } from '../utils/period';

export type HomeWidgetSnapshot = {
  balanceMinor: number;
  monthExpenseMinor: number;
  monthIncomeMinor: number;
  todaySpentMinor: number;
  balanceLabel: string;
  monthExpenseLabel: string;
  monthIncomeLabel: string;
  monthLabel: string;
  currency: string;
  updatedAt: number;
};

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncInFlight: Promise<void> | null = null;

export async function computeHomeWidgetSnapshot(): Promise<HomeWidgetSnapshot> {
  const now = new Date();
  const baseCurrency = useSettingsStore.getState().baseCurrency || 'USD';
  const monthRange = getPeriodRange(now, 'month');
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  const [accounts, currencies, monthExpenseMinor, monthIncomeMinor, todaySpentMinor] =
    await Promise.all([
      listAccountsWithBalances(),
      listCurrencies(),
      getExpenseTotals(monthRange.start, monthRange.end),
      getIncomeTotals(monthRange.start, monthRange.end),
      getExpenseTotals(dayStart.getTime(), dayEnd.getTime()),
    ]);

  const rateMap = buildRateMap(currencies, baseCurrency);
  const balanceMinor = accounts.reduce((sum, account) => {
    const amount = account.balance_minor ?? account.starting_balance_minor;
    return sum + convertMinorToBase(amount, account.currency, rateMap, baseCurrency);
  }, 0);

  return {
    balanceMinor,
    monthExpenseMinor,
    monthIncomeMinor,
    todaySpentMinor,
    balanceLabel: formatSigned(balanceMinor, baseCurrency),
    monthExpenseLabel: formatSigned(monthExpenseMinor, baseCurrency),
    monthIncomeLabel: formatSigned(monthIncomeMinor, baseCurrency),
    monthLabel: format(now, 'MMMM yyyy'),
    currency: baseCurrency,
    updatedAt: Date.now(),
  };
}

async function pushWidgetSnapshots(snapshot: HomeWidgetSnapshot): Promise<void> {
  // Widget layouts import @expo/ui/swift-ui, which crashes Android if loaded
  // into the main JS bundle (requireNativeView('ExpoUI', ...) at module init).
  if (Platform.OS !== 'ios') return;

  try {
    const [
      { default: BalanceWidget },
      { default: MonthExpensesWidget },
      { default: MonthIncomeWidget },
      { default: QuickAddExpenseWidget },
    ] = await Promise.all([
      import('../widgets/BalanceWidget'),
      import('../widgets/MonthExpensesWidget'),
      import('../widgets/MonthIncomeWidget'),
      import('../widgets/QuickAddExpenseWidget'),
    ]);

    BalanceWidget.updateSnapshot({
      amountLabel: snapshot.balanceLabel,
      subtitle: 'Total balance',
    });
    MonthExpensesWidget.updateSnapshot({
      amountLabel: snapshot.monthExpenseLabel,
      monthLabel: snapshot.monthLabel,
      subtitle: 'Spent this month',
    });
    MonthIncomeWidget.updateSnapshot({
      amountLabel: snapshot.monthIncomeLabel,
      monthLabel: snapshot.monthLabel,
      subtitle: 'Earned this month',
    });
    QuickAddExpenseWidget.updateSnapshot({
      title: 'Add expense',
      subtitle: 'Tap to log spending',
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[homeScreenWidgetSync] failed to push snapshots', error);
    }
  }
}

export async function syncHomeScreenWidgets(): Promise<void> {
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    try {
      const snapshot = await computeHomeWidgetSnapshot();
      await pushWidgetSnapshots(snapshot);
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

/** Debounced sync for mutation hot paths. */
export function scheduleHomeScreenWidgetSync(delayMs = 300): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void syncHomeScreenWidgets();
  }, delayMs);
}
