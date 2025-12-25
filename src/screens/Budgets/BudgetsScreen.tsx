import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { archiveBudget, listBudgets } from '../../db/repositories/budgets';
import { sumExpensesByCategory } from '../../db/repositories/expenses';
import { getPeriodRange } from '../../utils/period';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useUIStore } from '../../state/useUIStore';
import { formatSigned } from '../../utils/money';
import { SwipeableRow } from '../../components/SwipeableRow';

export default function BudgetsScreen() {
  const navigation = useNavigation();
  const { budgetPeriod, setBudgetPeriod } = useUIStore();
  const [budgets, setBudgets] = useState<
    { id: string; name: string; spent: number; limit: number; color: string }[]
  >([]);

  const load = useCallback(() => {
    const range = getPeriodRange(new Date(), budgetPeriod);
    Promise.all([listBudgets(), sumExpensesByCategory(range.start, range.end)]).then(
      ([budgetRows, spentRows]) => {
        const spentMap = new Map(spentRows.map((row) => [row.category_id, row.total_minor]));
        setBudgets(
          budgetRows.map((budget) => ({
            id: budget.id,
            name: budget.category_name,
            spent: spentMap.get(budget.category_id) ?? 0,
            limit: budget.amount_minor,
            color: budget.category_color,
          })),
        );
      },
    );
  }, [budgetPeriod]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 24 }}
    >
      <View className="mb-5">
        <SegmentedControl
          options={[
            { label: 'Week', value: 'week' },
            { label: 'Month', value: 'month' },
            { label: 'Year', value: 'year' },
          ]}
          value={budgetPeriod}
          onChange={(value) => setBudgetPeriod(value)}
        />
      </View>

      {budgets.length === 0 ? (
        <EmptyState title="No budgets yet" subtitle="Create a category budget to stay on track." />
      ) : (
        budgets.map((budget) => {
          const progress = Math.min(1, budget.spent / budget.limit);
          const overspent = budget.spent > budget.limit;
          return (
            <View key={budget.id} className="mb-4">
              <SwipeableRow
                onEdit={() => navigation.navigate('BudgetForm' as never, { id: budget.id } as never)}
                onDelete={async () => {
                  await archiveBudget(budget.id);
                  load();
                }}
              >
                <Card>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-base font-display text-app-text dark:text-app-text-dark">
                      {budget.name}
                    </Text>
                    <Text
                      className={`text-sm font-emphasis ${
                        overspent ? 'text-app-danger' : 'text-app-muted dark:text-app-muted-dark'
                      }`}
                    >
                      {formatSigned(budget.spent, 'USD')} / {formatSigned(budget.limit, 'USD')}
                    </Text>
                  </View>
                  <View className="h-2 rounded-full bg-app-soft dark:bg-app-soft-dark overflow-hidden">
                    <View
                      className="h-2 rounded-full"
                      style={{
                        width: `${progress * 100}%`,
                        backgroundColor: overspent ? '#EF4444' : budget.color,
                      }}
                    />
                  </View>
                  <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-2">
                    {overspent ? 'Overspent' : `${Math.round(progress * 100)}% used`}
                  </Text>
                </Card>
              </SwipeableRow>
            </View>
          );
        })
      )}

      <Button title="Add budget" onPress={() => navigation.navigate('BudgetForm' as never)} />
    </ScrollView>
  );
}
