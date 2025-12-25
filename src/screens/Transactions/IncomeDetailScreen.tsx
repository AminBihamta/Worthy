import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Card } from '../../components/Card';
import { deleteIncome, getIncome, IncomeListRow } from '../../db/repositories/incomes';
import { formatSigned } from '../../utils/money';
import { formatDate, formatDateTime } from '../../utils/time';
import { Button } from '../../components/Button';
import { getRecurringRuleForEntity, RecurringRuleRow } from '../../db/repositories/recurring';
import { formatRRule } from '../../utils/recurring';

export default function IncomeDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { id: string } | undefined;
  const [income, setIncome] = useState<IncomeListRow | null>(null);
  const [recurringRule, setRecurringRule] = useState<RecurringRuleRow | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!params?.id) return;
      Promise.all([getIncome(params.id), getRecurringRuleForEntity('income', params.id)]).then(
        ([row, recurring]) => {
          setIncome(row);
          setRecurringRule(recurring);
        },
      );
    }, [params?.id]),
  );

  if (!income) {
    return (
      <View className="flex-1 bg-app-bg dark:bg-app-bg-dark items-center justify-center">
        <Text className="text-sm text-app-muted dark:text-app-muted-dark">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 24 }}
    >
      <Card className="mb-4">
        <Text className="text-2xl font-display text-app-text dark:text-app-text-dark">
          {formatSigned(income.amount_minor, income.account_currency)}
        </Text>
        <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-1">
          {income.source}
        </Text>
        <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-2">
          {formatDate(income.date_ts)}
        </Text>
      </Card>

      <Card className="mb-4">
        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
          Account
        </Text>
        <Text className="text-base font-display text-app-text dark:text-app-text-dark mt-1">
          {income.account_name} · {income.account_currency}
        </Text>
        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mt-4">
          Hours worked
        </Text>
        <Text className="text-base font-display text-app-text dark:text-app-text-dark mt-1">
          {income.hours_worked ?? 'Not provided'}
        </Text>
        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mt-4">
          Recurring
        </Text>
        <Text className="text-base font-display text-app-text dark:text-app-text-dark mt-1">
          {formatRRule(recurringRule?.rrule_text)}
        </Text>
        {recurringRule ? (
          <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
            {recurringRule.active ? 'Active' : 'Paused'} · Next{' '}
            {formatDate(recurringRule.next_run_ts)}
          </Text>
        ) : null}
      </Card>

      <Card>
        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
          Notes
        </Text>
        <Text className="text-base text-app-text dark:text-app-text-dark mt-1">
          {income.notes ? income.notes : 'No notes'}
        </Text>
      </Card>

      <Card className="mt-4">
        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
          Activity
        </Text>
        <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-2">
          Created {formatDateTime(income.created_at)}
        </Text>
        <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
          Updated {formatDateTime(income.updated_at)}
        </Text>
      </Card>

      <View className="flex-row gap-3 mt-6">
        <View className="flex-1">
          <Button
            title="Edit income"
            variant="secondary"
            onPress={() => navigation.navigate('AddIncome' as never, { id: income.id } as never)}
          />
        </View>
        <View className="flex-1">
          <Button
            title="Delete"
            variant="danger"
            onPress={async () => {
              await deleteIncome(income.id);
              navigation.goBack();
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}
