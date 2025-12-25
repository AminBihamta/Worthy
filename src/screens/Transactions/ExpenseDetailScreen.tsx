import React, { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Card } from '../../components/Card';
import { LifeCostPill } from '../../components/LifeCostPill';
import { deleteExpense, getExpense, ExpenseListRow } from '../../db/repositories/expenses';
import { formatSigned } from '../../utils/money';
import { formatDate, formatDateTime } from '../../utils/time';
import { getEffectiveHourlyRate } from '../../db/repositories/analytics';
import { formatLifeCost } from '../../utils/lifeCost';
import { useSettingsStore } from '../../state/useSettingsStore';
import { Button } from '../../components/Button';
import { getRecurringRuleForEntity, RecurringRuleRow } from '../../db/repositories/recurring';
import { formatRRule } from '../../utils/recurring';
import { getReceiptForExpense, ReceiptInboxRow } from '../../db/repositories/receipts';

export default function ExpenseDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { id: string } | undefined;
  const [expense, setExpense] = useState<ExpenseListRow | null>(null);
  const [lifeCost, setLifeCost] = useState<string | null>(null);
  const [recurringRule, setRecurringRule] = useState<RecurringRuleRow | null>(null);
  const [receipt, setReceipt] = useState<ReceiptInboxRow | null>(null);
  const { fixedHourlyRateMinor, hoursPerDay } = useSettingsStore();

  useFocusEffect(
    useCallback(() => {
      if (!params?.id) return;
      Promise.all([
        getExpense(params.id),
        getEffectiveHourlyRate(),
        getRecurringRuleForEntity('expense', params.id),
        getReceiptForExpense(params.id),
      ]).then(([row, hourly, recurring, linkedReceipt]) => {
        setExpense(row);
        setRecurringRule(recurring);
        setReceipt(linkedReceipt);
        const fallback = fixedHourlyRateMinor > 0 ? fixedHourlyRateMinor : null;
        const rate = hourly.hourly_rate_minor ?? fallback;
        if (row) {
          setLifeCost(formatLifeCost(row.amount_minor, rate, hoursPerDay));
        }
      });
    }, [params?.id, fixedHourlyRateMinor, hoursPerDay]),
  );

  const regretLabel = useMemo(() => {
    if (!expense) return '';
    const value = Math.max(0, Math.min(100, Math.round(expense.slider_0_100 / 25) * 25));
    switch (value) {
      case 0:
        return 'Total regret';
      case 25:
        return 'Mostly regret';
      case 50:
        return 'Mixed feelings';
      case 75:
        return 'Worth it';
      case 100:
        return 'Absolutely worth it';
      default:
        return 'Mixed feelings';
    }
  }, [expense]);

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
      contentContainerStyle={{ padding: 24 }}
    >
      <Card className="mb-4">
        <Text className="text-2xl font-display text-app-text dark:text-app-text-dark">
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
        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
          Category
        </Text>
        <Text className="text-base font-display text-app-text dark:text-app-text-dark mt-1">
          {expense.category_name}
        </Text>
        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mt-4">
          Account
        </Text>
        <Text className="text-base font-display text-app-text dark:text-app-text-dark mt-1">
          {expense.account_name} · {expense.account_currency}
        </Text>
        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mt-4">
          Worth it
        </Text>
        <Text className="text-base font-display text-app-text dark:text-app-text-dark mt-1">
          {regretLabel} · {expense.slider_0_100}/100
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
          {expense.notes ? expense.notes : 'No notes'}
        </Text>
      </Card>

      {receipt ? (
        <Card className="mt-4">
          <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
            Receipt
          </Text>
          <Image
            source={{ uri: receipt.image_uri }}
            className="w-full h-56 rounded-2xl mt-3"
            resizeMode="cover"
          />
          <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-3">
            Added {formatDateTime(receipt.created_at)}
          </Text>
        </Card>
      ) : null}

      <Card className="mt-4">
        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
          Activity
        </Text>
        <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-2">
          Created {formatDateTime(expense.created_at)}
        </Text>
        <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
          Updated {formatDateTime(expense.updated_at)}
        </Text>
      </Card>

      <View className="flex-row gap-3 mt-6">
        <View className="flex-1">
          <Button
            title="Edit expense"
            variant="secondary"
            onPress={() => navigation.navigate('AddExpense' as never, { id: expense.id } as never)}
          />
        </View>
        <View className="flex-1">
          <Button
            title="Delete"
            variant="danger"
            onPress={async () => {
              await deleteExpense(expense.id);
              navigation.goBack();
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}
