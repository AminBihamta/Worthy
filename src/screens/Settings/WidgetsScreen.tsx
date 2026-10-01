import React, { useCallback } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSettingsStore } from '../../state/useSettingsStore';
import { useWidgetStats } from '../../hooks/useWidgetStats';
import {
  MonthExpensesWidget,
  MonthIncomeWidget,
  QuickAddExpensePreview,
  TotalBalanceWidget,
} from '../../components/widgets/InsightStatWidgets';
import { syncHomeScreenWidgets } from '../../services/homeScreenWidgetSync';

export default function WidgetsScreen() {
  const { baseCurrency } = useSettingsStore();
  const {
    loading,
    totalBalanceMinor,
    monthExpenseMinor,
    monthIncomeMinor,
    monthLabel,
    load,
  } = useWidgetStats();
  const currency = baseCurrency || 'USD';

  useFocusEffect(
    useCallback(() => {
      load();
      void syncHomeScreenWidgets();
    }, [load]),
  );

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
    >
      <Text className="text-sm text-app-muted dark:text-app-muted-dark mb-2 leading-5">
        Add Worthy widgets to your {Platform.OS === 'ios' ? 'iPhone' : 'Android'} home screen for
        glanceable balance, monthly totals, and quick expense entry.
      </Text>
      <Text className="text-xs text-app-muted dark:text-app-muted-dark mb-6 leading-5">
        {Platform.OS === 'ios'
          ? 'Long-press the home screen → tap + → search “Worthy” → add a widget.'
          : 'Long-press the home screen → Widgets → Worthy → add a widget.'}
      </Text>

      <Text className="text-xs font-medium uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-3">
        Preview
      </Text>

      <View className="gap-4">
        <TotalBalanceWidget
          amountMinor={totalBalanceMinor}
          currency={currency}
          loading={loading}
        />
        <MonthExpensesWidget
          monthLabel={monthLabel || 'This month'}
          amountMinor={monthExpenseMinor}
          currency={currency}
          loading={loading}
        />
        <MonthIncomeWidget
          monthLabel={monthLabel || 'This month'}
          amountMinor={monthIncomeMinor}
          currency={currency}
          loading={loading}
        />
        <QuickAddExpensePreview />
      </View>
    </ScrollView>
  );
}
