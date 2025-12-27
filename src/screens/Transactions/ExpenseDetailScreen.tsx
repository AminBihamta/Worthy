import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { PressableScale } from '../../components/PressableScale';
import { HeaderIconButton } from '../../components/HeaderIconButton';
import { LifeCostPill } from '../../components/LifeCostPill';
import {
  deleteExpense,
  getExpense,
  listExpenses,
  sumExpensesByCategory,
  ExpenseListRow,
} from '../../db/repositories/expenses';
import { listCurrencies } from '../../db/repositories/currencies';
import { listBudgets } from '../../db/repositories/budgets';
import { formatMinor } from '../../utils/money';
import { getPeriodRange } from '../../utils/period';
import { formatDate, formatDateTime } from '../../utils/time';
import { getEffectiveHourlyRate } from '../../db/repositories/analytics';
import { formatLifeCost } from '../../utils/lifeCost';
import { useSettingsStore } from '../../state/useSettingsStore';
import { Button } from '../../components/Button';
import { getRecurringRuleForEntity, RecurringRuleRow } from '../../db/repositories/recurring';
import { formatRRule } from '../../utils/recurring';
import { getReceiptForExpense, ReceiptInboxRow } from '../../db/repositories/receipts';
import { buildRateMap, convertMinorToBase } from '../../utils/currency';

const regretOptions = [
  { value: 0, label: 'Total regret', icon: 'frown' },
  { value: 25, label: 'Mostly regret', icon: 'meh' },
  { value: 50, label: 'Mixed feelings', icon: 'minus' },
  { value: 75, label: 'Worth it', icon: 'smile' },
  { value: 100, label: 'Absolutely worth it', icon: 'heart' },
];

type BudgetMeta = {
  periodLabel: string;
  budgetAmountMinor: number;
  spentTotalMinor: number;
  impactPct: number;
};

type CategoryStats = {
  averageMinor: number | null;
  maxMinor: number | null;
  count: number;
};

export default function ExpenseDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = route.params as { id: string; origin?: 'home' } | undefined;
  const [expense, setExpense] = useState<ExpenseListRow | null>(null);
  const [lifeCost, setLifeCost] = useState<string | null>(null);
  const [recurringRule, setRecurringRule] = useState<RecurringRuleRow | null>(null);
  const [receipt, setReceipt] = useState<ReceiptInboxRow | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [budgetMeta, setBudgetMeta] = useState<BudgetMeta | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null);
  const { hoursPerDay, baseCurrency } = useSettingsStore();
  const origin = params?.origin;

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderIconButton
          icon="more-horizontal"
          onPress={() => setMenuOpen(true)}
          accessibilityLabel="More options"
        />
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (origin !== 'home') return;
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      event.preventDefault();
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('HomeStack' as never);
      } else {
        navigation.navigate('HomeStack' as never);
      }
    });

    return unsubscribe;
  }, [navigation, origin]);

  useFocusEffect(
    useCallback(() => {
      if (!params?.id) return;
      let active = true;

      const load = async () => {
        const [row, hourly, recurring, linkedReceipt, currencyRows] = await Promise.all([
          getExpense(params.id),
          getEffectiveHourlyRate(),
          getRecurringRuleForEntity('expense', params.id),
          getReceiptForExpense(params.id),
          listCurrencies(),
        ]);

        if (!active) return;

        setExpense(row);
        const rateLookup = buildRateMap(currencyRows, baseCurrency);
        setRecurringRule(recurring);
        setReceipt(linkedReceipt);
        setLifeCost(null);
        setBudgetMeta(null);
        setCategoryStats(null);

        const rate = hourly.hourly_rate_minor ?? null;
        if (row && rate) {
          const expenseCurrency = row.currency_code ?? row.account_currency ?? baseCurrency;
          const amountBase = convertMinorToBase(row.amount_minor, expenseCurrency, rateLookup, baseCurrency);
          setLifeCost(formatLifeCost(amountBase, rate, hoursPerDay));
        }

        if (!row) return;

        const range = getPeriodRange(new Date(row.date_ts), 'month');
        const [budgets, totals, categoryExpenses] = await Promise.all([
          listBudgets(false),
          sumExpensesByCategory(range.start, range.end),
          listExpenses({ categoryId: row.category_id, start: range.start, end: range.end }),
        ]);

        if (!active) return;

        const budget =
          budgets.find((item) => item.category_id === row.category_id && item.period_type === 'month') ??
          budgets.find((item) => item.category_id === row.category_id);

        const spentTotal =
          totals.find((item) => item.category_id === row.category_id)?.total_minor ?? 0;

        if (budget?.amount_minor && budget.amount_minor > 0) {
          const periodLabel =
            budget.period_type === 'month'
              ? 'monthly'
              : budget.period_type === 'week'
                ? 'weekly'
                : budget.period_type === 'year'
                  ? 'yearly'
                  : budget.period_type;
          const expenseCurrency = row.currency_code ?? row.account_currency ?? baseCurrency;
          const amountBase = convertMinorToBase(row.amount_minor, expenseCurrency, rateLookup, baseCurrency);
          const impactPct = Math.max(0, Math.round((amountBase / budget.amount_minor) * 100));
          setBudgetMeta({
            periodLabel,
            budgetAmountMinor: budget.amount_minor,
            spentTotalMinor: spentTotal,
            impactPct,
          });
        }

        if (categoryExpenses.length) {
          const totals = categoryExpenses.map((item) =>
            convertMinorToBase(
              item.amount_minor,
              item.currency_code ?? item.account_currency ?? baseCurrency,
              rateLookup,
              baseCurrency,
            ),
          );
          const total = totals.reduce((sum, value) => sum + value, 0);
          const averageMinor = Math.round(total / totals.length);
          const maxMinor = totals.reduce((max, value) => Math.max(max, value), 0);
          setCategoryStats({
            averageMinor,
            maxMinor,
            count: categoryExpenses.length,
          });
        }
      };

      load();

      return () => {
        active = false;
      };
    }, [params?.id, hoursPerDay, baseCurrency]),
  );

  const handleDelete = async () => {
    if (!expense) return;
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(expense.id);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!expense) {
    return (
      <View className="flex-1 bg-app-bg dark:bg-app-bg-dark items-center justify-center">
        <Text className="text-app-muted dark:text-app-muted-dark">Loading...</Text>
      </View>
    );
  }

  const expenseCurrency = expense.currency_code ?? expense.account_currency ?? baseCurrency;

  const regretOption =
    regretOptions.find((o) => o.value === (Math.round(expense.slider_0_100 / 25) * 25)) ??
    regretOptions[2];

  const budgetImpactText = budgetMeta
    ? `${budgetMeta.impactPct}% of your ${budgetMeta.periodLabel} ${expense.category_name} budget`
    : null;

  const insightItems = (() => {
    const items: string[] = [];
    if (budgetMeta) {
      const remaining = budgetMeta.budgetAmountMinor - budgetMeta.spentTotalMinor;
        items.push(
          `Spent ${formatMinor(
            budgetMeta.spentTotalMinor,
            baseCurrency,
          )} ${budgetMeta.periodLabel} to date.`,
        );
      if (remaining >= 0) {
        items.push(
          `${formatMinor(
            remaining,
            baseCurrency,
          )} left in this budget after this expense.`,
        );
      } else {
        items.push(
          `Over budget by ${formatMinor(
            Math.abs(remaining),
            baseCurrency,
          )} after this expense.`,
        );
      }
    }

    if (categoryStats?.averageMinor && categoryStats.averageMinor > 0) {
      const average = categoryStats.averageMinor;
      if (expense.amount_minor > average * 1.15) {
        items.push(
          `Above your average ${expense.category_name} spend (${formatMinor(
            average,
            baseCurrency,
          )}).`,
        );
      }
    }

    if (
      categoryStats?.maxMinor &&
      categoryStats.count > 1 &&
      expense.amount_minor >= categoryStats.maxMinor
    ) {
      items.push(`Largest ${expense.category_name} expense this month.`);
    }

    return items.slice(0, 3);
  })();

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="items-center pt-12 pb-8 px-6">
          <Text className="text-7xl font-display text-app-text dark:text-app-text-dark text-center pt-4 leading-tight">
            {formatMinor(expense.amount_minor, expenseCurrency)}
          </Text>
          <Text className="text-xl text-app-muted dark:text-app-muted-dark text-center mt-2 font-medium">
            {expense.title}
          </Text>
        </View>

        {/* Main Details Card */}
        <View className="px-4 space-y-4">
          <View className="bg-app-card dark:bg-app-card-dark rounded-3xl overflow-hidden border border-app-border/50 dark:border-app-border-dark/50 mb-4">
            {/* Category */}
            <View className="flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                  <Feather name="tag" size={18} color={isDark ? '#F9E6F4' : '#2C0C4D'} />
                </View>
                <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Category</Text>
              </View>
              <Text className="text-base text-app-muted dark:text-app-muted-dark">
                {expense.category_name}
              </Text>
            </View>

            {/* Account */}
            <View className="flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                  <Feather name="credit-card" size={18} color={isDark ? '#F9E6F4' : '#2C0C4D'} />
                </View>
                <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Account</Text>
              </View>
              <Text className="text-base text-app-muted dark:text-app-muted-dark">
                {expense.account_name}
              </Text>
            </View>

            {/* Date */}
            <View className="flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                  <Feather name="calendar" size={18} color={isDark ? '#F9E6F4' : '#2C0C4D'} />
                </View>
                <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Date</Text>
              </View>
              <Text className="text-base text-app-muted dark:text-app-muted-dark">
                {formatDate(expense.date_ts)}
              </Text>
            </View>

             {/* Life Cost */}
            <View className="flex-row items-center justify-between p-5">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                  <Feather name="clock" size={18} color={isDark ? '#F9E6F4' : '#2C0C4D'} />
                </View>
                <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Life Cost</Text>
              </View>
              <Text className="text-base text-app-muted dark:text-app-muted-dark">
         {lifeCost}
              </Text>
            </View>
          </View>

        

          {/* Worth It Section */}
          <View className="bg-app-card dark:bg-app-card-dark rounded-3xl p-6 border border-app-border/50 dark:border-app-border-dark/50">
            <View className="items-center mb-4">
              <View className="w-12 h-12 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center mb-3">
                <Feather name={regretOption.icon as any} size={24} color={isDark ? '#7D3AE6' : '#5C2AAE'} />
              </View>
              <Text className="text-lg font-display text-app-text dark:text-app-text-dark">
                {regretOption.label}
              </Text>
            </View>
            <Slider
              value={expense.slider_0_100}
              minimumValue={0}
              maximumValue={100}
              disabled
              minimumTrackTintColor={isDark ? '#7D3AE6' : '#5C2AAE'}
              maximumTrackTintColor={isDark ? '#3A254F' : '#F2C7E3'}
              thumbTintColor={isDark ? '#7D3AE6' : '#5C2AAE'}
              style={{ height: 40, opacity: 0.8 }}
            />
          </View>

          {/* Notes */}
          {expense.notes ? (
            <View className="bg-app-card dark:bg-app-card-dark rounded-3xl p-5 border border-app-border/50 dark:border-app-border-dark/50">
              <View className="flex-row items-center gap-3 mb-2">
                <Feather name="file-text" size={16} color={isDark ? '#C8A9C2' : '#8A6B9A'} />
                <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
                  Notes
                </Text>
              </View>
              <Text className="text-base text-app-text dark:text-app-text-dark leading-6">
                {expense.notes}
              </Text>
            </View>
          ) : null}

          {/* Recurring Info */}
          {recurringRule && (
            <View className="bg-app-soft dark:bg-app-soft-dark rounded-3xl p-5 flex-row items-center gap-4 border border-app-brand/20 dark:border-app-brand-dark/20">
              <View className="w-10 h-10 rounded-full bg-app-brand dark:bg-app-brand-dark items-center justify-center">
                <Feather name="repeat" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text className="text-base font-medium text-app-brand dark:text-app-brand-dark">
                  Recurring Expense
                </Text>
                <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                  Repeats monthly
                </Text>
              </View>
            </View>
          )}

          {/* Insights */}
          {insightItems.length > 0 && (
            <View className="bg-app-card dark:bg-app-card-dark rounded-3xl p-5 border border-app-border/50 dark:border-app-border-dark/50">
              <View className="flex-row items-center gap-3 mb-2">
                <Feather name="trending-up" size={16} color={isDark ? '#C8A9C2' : '#8A6B9A'} />
                <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
                  Insights
                </Text>
              </View>
              <View className="space-y-2">
                {insightItems.map((item, index) => (
                  <Text key={index} className="text-sm text-app-text dark:text-app-text-dark">
                    • {item}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Receipt */}
          {receipt && (
            <View className="bg-app-card dark:bg-app-card-dark rounded-3xl p-5 border border-app-border/50 dark:border-app-border-dark/50">
              <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-3">
                Receipt
              </Text>
              <Image
                source={{ uri: receipt.image_uri }}
                className="w-full h-56 rounded-2xl"
                resizeMode="cover"
              />
              <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-3">
                Added {formatDateTime(receipt.created_at)}
              </Text>
            </View>
          )}
        </View>

        <View className="px-6 mt-8">
          <Button
            title="Edit Expense"
            onPress={() => navigation.navigate('AddEditExpense', { id: expense.id })}
            variant="secondary"
            icon={<Feather name="edit-2" size={18} color={isDark ? '#F9E6F4' : '#2C0C4D'} />}
          />
        </View>
      </ScrollView>

      {/* Menu Modal */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setMenuOpen(false)}>
          <View className="bg-app-card dark:bg-app-card-dark rounded-t-[32px] p-6 pb-10">
            <View className="items-center mb-6">
              <View className="w-12 h-1.5 rounded-full bg-app-border dark:bg-app-border-dark" />
            </View>
            <PressableScale
              className="flex-row items-center p-4 rounded-2xl bg-app-danger/10 mb-2"
              onPress={() => {
                setMenuOpen(false);
                setTimeout(handleDelete, 200);
              }}
            >
              <View className="w-10 h-10 rounded-full bg-app-danger/20 items-center justify-center mr-4">
                <Feather name="trash-2" size={20} color="#EF4444" />
              </View>
              <Text className="text-lg font-medium text-app-danger">Delete Expense</Text>
            </PressableScale>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
