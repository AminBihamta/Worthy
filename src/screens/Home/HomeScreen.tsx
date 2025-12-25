import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Card } from '../../components/Card';
import { PressableScale } from '../../components/PressableScale';
import { SectionHeader } from '../../components/SectionHeader';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import { getEffectiveHourlyRate } from '../../db/repositories/analytics';
import { getExpenseTotals } from '../../db/repositories/expenses';
import { getIncomeTotals } from '../../db/repositories/incomes';
import { listAccounts } from '../../db/repositories/accounts';
import { listTransactions } from '../../db/repositories/transactions';
import { useSettingsStore } from '../../state/useSettingsStore';
import { formatSigned } from '../../utils/money';
import { getPeriodRange } from '../../utils/period';
import { TransactionRow } from '../../components/TransactionRow';
import { formatShortDate } from '../../utils/time';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const { fixedHourlyRateMinor, hoursPerDay } = useSettingsStore();
  const [summary, setSummary] = useState({ spent: 0, income: 0 });
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof listTransactions>>>([]);
  const [hourlyRateMinor, setHourlyRateMinor] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof listAccounts>>>([]);

  const load = useCallback(() => {
    const now = new Date();
    const range = getPeriodRange(now, 'month');
    Promise.all([
      getExpenseTotals(range.start, range.end),
      getIncomeTotals(range.start, range.end),
      listAccounts(),
      listTransactions({ limit: 5 }),
      getEffectiveHourlyRate(),
    ]).then(([spent, income, accountsRows, recentRows, hourly]) => {
      setSummary({ spent, income });
      setAccounts(accountsRows);
      setRecent(recentRows);
      const fallback = fixedHourlyRateMinor > 0 ? fixedHourlyRateMinor : null;
      setHourlyRateMinor(hourly.hourly_rate_minor ?? fallback);
    });
  }, [fixedHourlyRateMinor]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const primaryAccount = accounts[0] ?? null;
  const balanceCurrency = primaryAccount?.currency ?? 'USD';
  const totalBalance = summary.income - summary.spent;
  const brandColor = colorScheme === 'dark' ? '#8B5CF6' : '#6D28D9';
  const accentColor = colorScheme === 'dark' ? '#67E8F9' : '#22D3EE';
  const cardAccents = useMemo(
    () => [brandColor, accentColor, colorScheme === 'dark' ? '#38BDF8' : '#0EA5E9'],
    [accentColor, brandColor, colorScheme],
  );
  const quickActions = useMemo(
    () => [
      {
        label: 'Transfer',
        icon: 'repeat' as const,
        onPress: () => navigation.navigate('AddTransfer' as never),
      },
      {
        label: 'Accounts',
        icon: 'credit-card' as const,
        onPress: () => navigation.navigate('Accounts' as never),
      },
      {
        label: 'Categories',
        icon: 'grid' as const,
        onPress: () => navigation.navigate('Categories' as never),
      },
      {
        label: 'Receipts',
        icon: 'camera' as const,
        onPress: () => navigation.navigate('ReceiptInbox' as never),
      },
    ],
    [navigation],
  );

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 200 }}
      >
        <View className="relative rounded-[36px] bg-app-soft dark:bg-app-soft-dark p-6 mb-6 overflow-hidden">
          <View
            className="absolute -top-12 -right-10 h-40 w-40 rounded-full"
            style={{ backgroundColor: accentColor, opacity: 0.16 }}
          />
          <View
            className="absolute -bottom-12 -left-10 h-36 w-36 rounded-full"
            style={{ backgroundColor: brandColor, opacity: 0.12 }}
          />
          <View className="flex-row items-center justify-between mb-6">
            <PressableScale
              onPress={() => navigation.navigate('TransactionsStack' as never)}
              haptic
            >
              <View className="h-11 w-11 rounded-2xl bg-app-card dark:bg-app-card-dark items-center justify-center">
                <Feather name="search" size={18} color={brandColor} />
              </View>
            </PressableScale>
            <View className="h-11 w-11 rounded-full bg-app-card dark:bg-app-card-dark items-center justify-center">
              <Text className="text-sm font-emphasis text-app-text dark:text-app-text-dark">W</Text>
            </View>
          </View>

          <Text className="text-sm uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
            Total balance
          </Text>
          <AnimatedNumber
            value={formatSigned(totalBalance, balanceCurrency)}
            className="text-[40px] font-display text-app-text dark:text-app-text-dark mt-2"
          />
          <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mt-2">
            Across all accounts
          </Text>

          <View className="mt-5">
            <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-3">
              Accounts
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-4">
                {accounts.length === 0 ? (
                  <View className="w-64 rounded-[26px] border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-5 items-center justify-center">
                    <Text className="text-sm text-app-muted dark:text-app-muted-dark">
                      No accounts yet
                    </Text>
                  </View>
                ) : (
                  accounts.map((account, index) => {
                    const accent = cardAccents[index % cardAccents.length];
                    const suffix = account.id.slice(-4);
                    return (
                      <PressableScale
                        key={account.id}
                        onPress={() =>
                          navigation.navigate('AccountForm' as never, { id: account.id } as never)
                        }
                        haptic
                      >
                        <View className="w-64 rounded-[26px] border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-5 overflow-hidden shadow-lg">
                          <View
                            className="absolute -top-10 -right-12 h-28 w-28 rounded-full"
                            style={{ backgroundColor: accent, opacity: 0.18 }}
                          />
                          <View
                            className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full"
                            style={{ backgroundColor: accent, opacity: 0.12 }}
                          />
                          <View className="flex-row items-center justify-between">
                            <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
                              {account.type}
                            </Text>
                            <Feather name="credit-card" size={16} color={accent} />
                          </View>
                          <Text className="text-base font-display text-app-text dark:text-app-text-dark mt-3">
                            {account.name}
                          </Text>
                          <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
                            {account.currency} · •• {suffix}
                          </Text>
                          <Text className="text-2xl font-display text-app-text dark:text-app-text-dark mt-4">
                            {formatSigned(account.starting_balance_minor, account.currency)}
                          </Text>
                        </View>
                      </PressableScale>
                    );
                  })
                )}
                <PressableScale onPress={() => navigation.navigate('AccountForm' as never)} haptic>
                  <View className="w-40 rounded-[26px] border border-dashed border-app-border dark:border-app-border-dark bg-transparent items-center justify-center p-5">
                    <View className="h-12 w-12 rounded-full bg-app-card dark:bg-app-card-dark items-center justify-center">
                      <Feather name="plus" size={18} color={brandColor} />
                    </View>
                    <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-2">
                      Add account
                    </Text>
                  </View>
                </PressableScale>
              </View>
            </ScrollView>
          </View>

          <View className="flex-row gap-3 mt-5">
            <View className="flex-1 rounded-2xl bg-app-card dark:bg-app-card-dark p-4">
              <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
                Spent
              </Text>
              <Text className="text-lg font-display text-app-danger mt-2">
                {formatSigned(summary.spent, balanceCurrency)}
              </Text>
            </View>
            <View className="flex-1 rounded-2xl bg-app-card dark:bg-app-card-dark p-4">
              <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
                Income
              </Text>
              <Text className="text-lg font-display text-app-success mt-2">
                {formatSigned(summary.income, balanceCurrency)}
              </Text>
            </View>
          </View>
        </View>

        <SectionHeader title="Quick actions" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
          <View className="flex-row gap-3">
            {quickActions.map((action) => (
              <PressableScale key={action.label} onPress={action.onPress} haptic>
                <View className="flex-row items-center gap-3 rounded-full bg-app-card dark:bg-app-card-dark px-4 py-3 border border-app-border dark:border-app-border-dark">
                  <View className="h-10 w-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                    <Feather name={action.icon} size={16} color={brandColor} />
                  </View>
                  <Text className="text-sm font-emphasis text-app-text dark:text-app-text-dark">
                    {action.label}
                  </Text>
                </View>
              </PressableScale>
            ))}
          </View>
        </ScrollView>

        <SectionHeader
          title="Transactions"
          action={
            <PressableScale
              onPress={() => navigation.navigate('TransactionsStack' as never)}
              haptic
            >
              <Text className="text-sm font-emphasis text-app-accent">See all</Text>
            </PressableScale>
          }
        />
        <View className="gap-3">
          {recent.length === 0 ? (
            <Card>
              <Text className="text-sm text-app-muted dark:text-app-muted-dark">
                No transactions yet. Start by adding one.
              </Text>
            </Card>
          ) : (
            recent.map((item) => (
              <View key={item.id}>
                <TransactionRow
                  transaction={item}
                  dateLabel={formatShortDate(item.date_ts)}
                  lifeCost={
                    item.type === 'expense' && hourlyRateMinor
                      ? `${(
                          Math.abs(item.amount_minor) /
                          hourlyRateMinor /
                          (hoursPerDay > 0 ? hoursPerDay : 8)
                        ).toFixed(1)}d`
                      : null
                  }
                  onPress={() => {
                    if (item.type === 'expense') {
                      navigation.navigate(
                        'TransactionsStack' as never,
                        { screen: 'ExpenseDetail', params: { id: item.id } } as never,
                      );
                    } else if (item.type === 'income') {
                      navigation.navigate(
                        'TransactionsStack' as never,
                        { screen: 'IncomeDetail', params: { id: item.id } } as never,
                      );
                    }
                  }}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <View
        className="absolute left-6 right-6 flex-row items-center justify-between"
        style={{ bottom: 20 }}
      >
        <PressableScale onPress={() => navigation.navigate('AddIncome' as never)} haptic>
          <View className="h-16 w-16 rounded-full items-center justify-center bg-app-brand shadow-lg">
            <Feather name="plus" size={26} color="#FFFFFF" />
          </View>
        </PressableScale>
        <PressableScale onPress={() => navigation.navigate('AddExpense' as never)} haptic>
          <View className="h-16 w-16 rounded-full items-center justify-center bg-app-accent shadow-lg">
            <Feather name="minus" size={26} color="#FFFFFF" />
          </View>
        </PressableScale>
      </View>
    </View>
  );
}
