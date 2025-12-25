import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { PressableScale } from '../../components/PressableScale';
import { SectionHeader } from '../../components/SectionHeader';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import { getEffectiveHourlyRate } from '../../db/repositories/analytics';
import { listBudgets } from '../../db/repositories/budgets';
import { getExpenseTotals, sumExpensesByCategory } from '../../db/repositories/expenses';
import { getIncomeTotals } from '../../db/repositories/incomes';
import { listTransactions } from '../../db/repositories/transactions';
import { useSettingsStore } from '../../state/useSettingsStore';
import { formatSigned } from '../../utils/money';
import { getPeriodRange } from '../../utils/period';
import { TransactionRow } from '../../components/TransactionRow';
import { formatShortDate } from '../../utils/time';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { fixedHourlyRateMinor, hoursPerDay } = useSettingsStore();
  const [summary, setSummary] = useState({ spent: 0, income: 0 });
  const [budgets, setBudgets] = useState<
    { id: string; name: string; spent: number; limit: number; color: string }[]
  >([]);
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof listTransactions>>>([]);
  const [hourlyRateMinor, setHourlyRateMinor] = useState<number | null>(null);

  const load = useCallback(() => {
    const now = new Date();
    const range = getPeriodRange(now, 'month');
    Promise.all([
      getExpenseTotals(range.start, range.end),
      getIncomeTotals(range.start, range.end),
      listBudgets(),
      sumExpensesByCategory(range.start, range.end),
      listTransactions({ limit: 5 }),
      getEffectiveHourlyRate(),
    ]).then(([spent, income, budgetsRows, spentByCategory, recentRows, hourly]) => {
      setSummary({ spent, income });
      const spentMap = new Map(spentByCategory.map((row) => [row.category_id, row.total_minor]));
      setBudgets(
        budgetsRows.map((budget) => ({
          id: budget.id,
          name: budget.category_name,
          spent: spentMap.get(budget.category_id) ?? 0,
          limit: budget.amount_minor,
          color: budget.category_color,
        })),
      );
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

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 200 }}>
      <View className="mb-6">
        <Text className="text-2xl font-display text-app-text dark:text-app-text-dark">
          Welcome back
        </Text>
        <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-2">
          Here is a clean snapshot of this month.
        </Text>
      </View>

      <Card className="mb-6">
        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
          Available this month
        </Text>
        <AnimatedNumber
          value={formatSigned(summary.income - summary.spent, 'USD')}
          className="text-3xl font-display text-app-text dark:text-app-text-dark mt-2"
        />
        <View className="flex-row items-center justify-between mt-4">
          <View>
            <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
              Spent
            </Text>
            <Text className="text-base font-display text-app-danger mt-1">
              {formatSigned(summary.spent, 'USD')}
            </Text>
          </View>
          <View>
            <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
              Income
            </Text>
            <Text className="text-base font-display text-app-success mt-1">
              {formatSigned(summary.income, 'USD')}
            </Text>
          </View>
        </View>
      </Card>

      <SectionHeader
        title="Quick actions"
        action={
          <Button
            title="Receipt"
            variant="secondary"
            onPress={() => navigation.navigate('ReceiptInbox' as never)}
            icon={(color) => <Feather name="camera" size={16} color={color} />}
          />
        }
      />
      <View className="flex-row gap-3 mb-8">
        <Button
          title="Transfer"
          variant="secondary"
          onPress={() => navigation.navigate('AddTransfer' as never)}
          icon={(color) => <Feather name="repeat" size={16} color={color} />}
        />
        <Button
          title="Accounts"
          variant="secondary"
          onPress={() => navigation.navigate('Accounts' as never)}
          icon={(color) => <Feather name="credit-card" size={16} color={color} />}
        />
        <Button
          title="Categories"
          variant="secondary"
          onPress={() => navigation.navigate('Categories' as never)}
          icon={(color) => <Feather name="grid" size={16} color={color} />}
        />
      </View>

      <SectionHeader title="Budgets" />
      <View className="mb-8">
        {budgets.length === 0 ? (
          <Card>
            <Text className="text-sm text-app-muted dark:text-app-muted-dark">
              Create a budget to track your category spending.
            </Text>
            <View className="mt-4">
              <Button
                title="Add budget"
                onPress={() =>
                  navigation.navigate('BudgetsStack' as never, { screen: 'BudgetForm' } as never)
                }
              />
            </View>
          </Card>
        ) : (
          budgets.map((budget) => {
            const progress = Math.min(1, budget.spent / budget.limit);
            return (
              <Card key={budget.id} className="mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-display text-app-text dark:text-app-text-dark">
                    {budget.name}
                  </Text>
                  <Text className="text-sm text-app-muted dark:text-app-muted-dark">
                    {formatSigned(budget.spent, 'USD')} / {formatSigned(budget.limit, 'USD')}
                  </Text>
                </View>
                <View className="h-2 rounded-full bg-app-soft dark:bg-app-soft-dark overflow-hidden">
                  <View
                    className="h-2 rounded-full"
                    style={{ width: `${progress * 100}%`, backgroundColor: budget.color }}
                  />
                </View>
              </Card>
            );
          })
        )}
      </View>

      <SectionHeader
        title="Recent activity"
        action={
          <PressableScale
            onPress={() => navigation.navigate('TransactionsStack' as never)}
            haptic
          >
            <Text className="text-sm font-emphasis text-app-accent">View all</Text>
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
