import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';
import { archiveBudget, listBudgets } from '../../db/repositories/budgets';
import { sumExpensesByCategory } from '../../db/repositories/expenses';
import { getPeriodRange } from '../../utils/period';
import { PressableScale } from '../../components/PressableScale';
import { EmptyState } from '../../components/EmptyState';
import { DateRangeSelector } from '../../components/DateRangeSelector';
import { useUIStore } from '../../state/useUIStore';
import { formatSigned } from '../../utils/money';
import { SwipeableRow } from '../../components/SwipeableRow';
import { useSettingsStore } from '../../state/useSettingsStore';

export default function BudgetsScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { budgetPeriod, setBudgetPeriod } = useUIStore();
  const { baseCurrency } = useSettingsStore();
  const [date, setDate] = useState(new Date());
  const [budgets, setBudgets] = useState<
    {
      id: string;
      name: string;
      spent: number;
      limit: number;
      color: string;
      icon: string;
    }[]
  >([]);

  const load = useCallback(() => {
    const range = getPeriodRange(date, budgetPeriod);
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
            icon: budget.category_icon,
          })),
        );
      },
    );
  }, [budgetPeriod, date]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const { totalSpent, totalLimit } = useMemo(() => {
    return budgets.reduce(
      (acc, b) => ({
        totalSpent: acc.totalSpent + b.spent,
        totalLimit: acc.totalLimit + b.limit,
      }),
      { totalSpent: 0, totalLimit: 0 },
    );
  }, [budgets]);

  const totalProgress = totalLimit > 0 ? Math.min(1, totalSpent / totalLimit) : 0;
  const totalRemaining = Math.max(0, totalLimit - totalSpent);

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 180 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-4xl font-display text-app-text dark:text-app-text-dark">
              Budgets
            </Text>
          </View>

          <DateRangeSelector
            period={budgetPeriod}
            date={date}
            onChangeDate={setDate}
            onChangePeriod={setBudgetPeriod}
          />

          {/* Summary Card */}
          {budgets.length > 0 && (
            <View className="mb-8 bg-app-card dark:bg-app-card-dark p-6 rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 shadow-sm">
              <Text className="text-xs font-bold text-app-muted dark:text-app-muted-dark uppercase tracking-widest mb-2">
                Total Remaining
              </Text>
              <Text className="text-4xl font-display text-app-text dark:text-app-text-dark mb-4">
                {formatSigned(totalRemaining, baseCurrency)}
              </Text>
              
              <View className="h-3 rounded-full bg-app-soft dark:bg-app-soft-dark overflow-hidden mb-2">
                <View
                  className="h-full rounded-full bg-app-brand dark:bg-app-brand-dark"
                  style={{ width: `${totalProgress * 100}%` }}
                />
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                  {Math.round(totalProgress * 100)}% used
                </Text>
                <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                  {formatSigned(totalLimit, baseCurrency)} limit
                </Text>
              </View>
            </View>
          )}

          {budgets.length === 0 ? (
            <EmptyState
              title="No budgets yet"
              subtitle="Create a category budget to stay on track."
            />
          ) : (
            <View className="gap-4">
              {budgets.map((budget) => {
                const progress = Math.min(1, budget.spent / budget.limit);
                const overspent = budget.spent > budget.limit;
                const remaining = Math.max(0, budget.limit - budget.spent);
                
                return (
                  <SwipeableRow
                    key={budget.id}
                    onEdit={() => navigation.navigate('BudgetForm' as never, { id: budget.id } as never)}
                    onDelete={async () => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      await archiveBudget(budget.id);
                      load();
                    }}
                  >
                    <PressableScale
                      className="bg-app-card dark:bg-app-card-dark p-5 rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 shadow-sm"
                      onPress={() => navigation.navigate('BudgetForm' as never, { id: budget.id } as never)}
                    >
                      <View className="flex-row items-center mb-4">
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: `${budget.color}20` }}
                        >
                          <Feather name={budget.icon as any} size={18} color={budget.color} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-display text-app-text dark:text-app-text-dark">
                            {budget.name}
                          </Text>
                          <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                            {overspent ? 'Over budget by ' : 'Left: '}
                            <Text className={overspent ? 'text-red-500 font-bold' : ''}>
                              {formatSigned(overspent ? budget.spent - budget.limit : remaining, baseCurrency)}
                            </Text>
                          </Text>
                        </View>
                        <Text className="text-sm font-bold text-app-text dark:text-app-text-dark">
                          {Math.round(progress * 100)}%
                        </Text>
                      </View>

                      <View className="h-2 rounded-full bg-app-soft dark:bg-app-soft-dark overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${progress * 100}%`,
                            backgroundColor: overspent ? '#D62828' : budget.color,
                          }}
                        />
                      </View>
                    </PressableScale>
                  </SwipeableRow>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <View className="absolute bottom-32 right-6 z-50">
        <PressableScale
          className="h-14 w-14 rounded-full bg-app-brand dark:bg-app-brand-dark items-center justify-center shadow-lg shadow-app-brand/30"
          onPress={() => {
            Haptics.selectionAsync();
            navigation.navigate('BudgetForm' as never);
          }}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </PressableScale>
      </View>
    </View>
  );
}
