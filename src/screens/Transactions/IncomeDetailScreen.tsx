import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Card } from '../../components/Card';
import { getIncome, IncomeListRow } from '../../db/repositories/incomes';
import { formatSigned } from '../../utils/money';
import { formatDate } from '../../utils/time';

export default function IncomeDetailScreen() {
  const route = useRoute();
  const params = route.params as { id: string } | undefined;
  const [income, setIncome] = useState<IncomeListRow | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!params?.id) return;
      getIncome(params.id).then((row) => {
        setIncome(row);
      });
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
      contentContainerStyle={{ padding: 20 }}
    >
      <Card className="mb-4">
        <Text className="text-2xl font-semibold text-app-text dark:text-app-text-dark">
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
        <Text className="text-sm text-app-muted dark:text-app-muted-dark">Account</Text>
        <Text className="text-base font-semibold text-app-text dark:text-app-text-dark mt-1">
          {income.account_name}
        </Text>
        <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-4">Hours worked</Text>
        <Text className="text-base font-semibold text-app-text dark:text-app-text-dark mt-1">
          {income.hours_worked ?? 'Not provided'}
        </Text>
      </Card>

      <Card>
        <Text className="text-sm text-app-muted dark:text-app-muted-dark">Notes</Text>
        <Text className="text-base text-app-text dark:text-app-text-dark mt-1">
          {income.notes ? income.notes : 'No notes'}
        </Text>
      </Card>
    </ScrollView>
  );
}
