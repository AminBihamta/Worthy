import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { SectionHeader } from '../../components/SectionHeader';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import { listBudgets } from '../../db/repositories/budgets';
import { getExpenseTotals, sumExpensesByCategory } from '../../db/repositories/expenses';
import { getIncomeTotals } from '../../db/repositories/incomes';
import { listTransactions } from '../../db/repositories/transactions';
import { formatSigned } from '../../utils/money';
import { getPeriodRange } from '../../utils/period';
import { TransactionRow } from '../../components/TransactionRow';
import { formatShortDate } from '../../utils/time';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [summary, setSummary] = useState({ spent: 0, income: 0 });
  const [budgets, setBudgets] = useState<
    { id: string; name: string; spent: number; limit: number; color: string }[]
  >([]);
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof listTransactions>>>([]);

  const load = useCallback(() => {
    const now = new Date();
    const range = getPeriodRange(now, 'month');
    Promise.all([
      getExpenseTotals(range.start, range.end),
      getIncomeTotals(range.start, range.end),
      listBudgets(),
      sumExpensesByCategory(range.start, range.end),
      listTransactions({ limit: 5 }),
    ]).then(([spent, income, budgetsRows, spentByCategory, recentRows]) => {
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
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 20 }}
    >
      <View className="mb-6">
        <Text className="text-3xl font-semibold text-app-text dark:text-app-text-dark">
          Welcome back
        </Text>
        <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-2">
          Track your money with intention.
        </Text>
      </View>

      <View className="flex-row gap-4 mb-6">
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
            Spent this month
          </Text>
          <AnimatedNumber
            value={formatSigned(-summary.spent, 'USD')}
            className="text-2xl font-semibold text-app-danger mt-2"
          />
        </Card>
        <Card className="flex-1">
          <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
            Income this month
          </Text>
          <AnimatedNumber
            value={formatSigned(summary.income, 'USD')}
            className="text-2xl font-semibold text-app-brand mt-2"
          />
        </Card>
      </View>

      <SectionHeader
        title="Quick add"
        action={
          <Button
            title="Receipt"
            variant="secondary"
            onPress={() => navigation.navigate('ReceiptInbox' as never)}
            icon={<Feather name="camera" size={16} color="#2F6F62" />}
          />
        }
      />
      <View className="flex-row gap-3 mb-8">
        <Button
          title="Expense"
          onPress={() => navigation.navigate('AddExpense' as never)}
          icon={<Feather name="minus-circle" size={16} color="#FFFFFF" />}
        />
        <Button
          title="Income"
          variant="secondary"
          onPress={() => navigation.navigate('AddIncome' as never)}
          icon={<Feather name="plus-circle" size={16} color="#2F6F62" />}
        />
        <Button
          title="Transfer"
          variant="secondary"
          onPress={() => navigation.navigate('AddTransfer' as never)}
          icon={<Feather name="repeat" size={16} color="#2F6F62" />}
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
                  <Text className="text-base font-semibold text-app-text dark:text-app-text-dark">
                    {budget.name}
                  </Text>
                  <Text className="text-sm text-app-muted dark:text-app-muted-dark">
                    {formatSigned(budget.spent, 'USD')} / {formatSigned(budget.limit, 'USD')}
                  </Text>
                </View>
                <View className="h-2 rounded-full bg-app-border dark:bg-app-border-dark overflow-hidden">
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

      <SectionHeader title="Recent activity" />
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
              <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
                {formatShortDate(item.date_ts)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
