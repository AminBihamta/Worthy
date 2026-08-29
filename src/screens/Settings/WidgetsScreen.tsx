import React, { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSettingsStore } from '../../state/useSettingsStore';
import { useWidgetStats } from '../../hooks/useWidgetStats';
import { MonthIncomeWidget, TodaySpendingWidget } from '../../components/widgets/InsightStatWidgets';

export default function WidgetsScreen() {
  const { baseCurrency } = useSettingsStore();
  const { loading, monthIncomeMinor, todaySpentMinor, monthLabel, load } = useWidgetStats();
  const currency = baseCurrency || 'USD';

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
    >
      <Text className="text-sm text-app-muted dark:text-app-muted-dark mb-4">
        Glanceable stats use your base currency and include all accounts. Same cards appear on Home.
      </Text>

      <View className="gap-4">
        <MonthIncomeWidget
          monthLabel={monthLabel}
          amountMinor={monthIncomeMinor}
          currency={currency}
          loading={loading}
        />
        <TodaySpendingWidget
          amountMinor={todaySpentMinor}
          currency={currency}
          loading={loading}
        />
      </View>
    </ScrollView>
  );
}
