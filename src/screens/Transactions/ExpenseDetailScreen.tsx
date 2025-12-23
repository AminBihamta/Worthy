import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Card } from '../../components/Card';
import { LifeCostPill } from '../../components/LifeCostPill';
import { getExpense, ExpenseListRow } from '../../db/repositories/expenses';
import { formatSigned } from '../../utils/money';
import { formatDate } from '../../utils/time';
import { getEffectiveHourlyRate } from '../../db/repositories/analytics';
import { formatLifeCost } from '../../utils/lifeCost';
import { useSettingsStore } from '../../state/useSettingsStore';

export default function ExpenseDetailScreen() {
  const route = useRoute();
  const params = route.params as { id: string } | undefined;
  const [expense, setExpense] = useState<ExpenseListRow | null>(null);
  const [lifeCost, setLifeCost] = useState<string | null>(null);
  const { fixedHourlyRateMinor, hoursPerDay } = useSettingsStore();

  useFocusEffect(
    useCallback(() => {
      if (!params?.id) return;
      Promise.all([getExpense(params.id), getEffectiveHourlyRate()]).then(([row, hourly]) => {
        setExpense(row);
        const fallback = fixedHourlyRateMinor > 0 ? fixedHourlyRateMinor : null;
        const rate = hourly.hourly_rate_minor ?? fallback;
        if (row) {
          setLifeCost(formatLifeCost(row.amount_minor, rate, hoursPerDay));
        }
      });
    }, [params?.id, fixedHourlyRateMinor, hoursPerDay]),
  );

  if (!expense) {
    return (
      <View className="flex-1 bg-app-bg dark:bg-app-bg-dark items-center justify-center">
        <Text className="text-sm text-app-muted dark:text-app-muted-dark">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 20 }}
    >
      <Card className="mb-4">
        <Text className="text-2xl font-semibold text-app-text dark:text-app-text-dark">
          {formatSigned(-expense.amount_minor, expense.account_currency)}
        </Text>
        <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-1">
          {expense.title}
        </Text>
        <View className="flex-row items-center mt-4">
          {lifeCost ? (
            <LifeCostPill value={lifeCost} />
          ) : (
            <Text className="text-xs text-app-muted dark:text-app-muted-dark">Set hourly rate</Text>
          )}
          <Text className="ml-3 text-xs text-app-muted dark:text-app-muted-dark">
            {formatDate(expense.date_ts)}
          </Text>
        </View>
      </Card>

      <Card className="mb-4">
        <Text className="text-sm text-app-muted dark:text-app-muted-dark">Category</Text>
        <Text className="text-base font-semibold text-app-text dark:text-app-text-dark mt-1">
          {expense.category_name}
        </Text>
        <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-4">Account</Text>
        <Text className="text-base font-semibold text-app-text dark:text-app-text-dark mt-1">
          {expense.account_name}
        </Text>
      </Card>

      <Card>
        <Text className="text-sm text-app-muted dark:text-app-muted-dark">Notes</Text>
        <Text className="text-base text-app-text dark:text-app-text-dark mt-1">
          {expense.notes ? expense.notes : 'No notes'}
        </Text>
      </Card>
    </ScrollView>
  );
}
