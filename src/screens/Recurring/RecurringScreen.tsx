import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listRecurringRules, updateRecurringRule } from '../../db/repositories/recurring';
import { getExpense } from '../../db/repositories/expenses';
import { getIncome } from '../../db/repositories/incomes';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { formatDate } from '../../utils/time';

export default function RecurringScreen() {
  const [rules, setRules] = useState<Awaited<ReturnType<typeof listRecurringRules>>>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    listRecurringRules().then(setRules);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const mapTitles = async () => {
      const next: Record<string, string> = {};
      for (const rule of rules) {
        if (rule.entity_type === 'expense') {
          const exp = await getExpense(rule.entity_id);
          if (exp) next[rule.id] = exp.title;
        } else {
          const inc = await getIncome(rule.entity_id);
          if (inc) next[rule.id] = inc.source;
        }
      }
      setTitles(next);
    };
    if (rules.length > 0) {
      mapTitles();
    }
  }, [rules]);

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
    >
      {rules.length === 0 ? (
        <EmptyState
          title="No recurring items"
          subtitle="Recurring expenses and incomes will appear here."
        />
      ) : (
        rules.map((rule) => (
          <Card key={rule.id} className="mb-4">
            <Text className="text-base font-display text-app-text dark:text-app-text-dark">
              {titles[rule.id] ?? 'Recurring item'}
            </Text>
            <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
              {rule.entity_type.toUpperCase()} · Next {formatDate(rule.next_run_ts)}
            </Text>
            <View className="mt-3">
              <Button
                title={rule.active ? 'Active' : 'Paused'}
                variant={rule.active ? 'primary' : 'secondary'}
                onPress={async () => {
                  await updateRecurringRule(rule.id, !rule.active);
                  load();
                }}
              />
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}
