import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { LifeCostPill } from '../../components/LifeCostPill';
import {
  deleteExpense,
  getExpense,
  listExpenses,
  sumExpensesByCategory,
  ExpenseListRow,
} from '../../db/repositories/expenses';
import { listBudgets } from '../../db/repositories/budgets';
import { formatMinor, formatSigned } from '../../utils/money';
import { getPeriodRange } from '../../utils/period';
import { formatDate, formatDateTime } from '../../utils/time';
import { getEffectiveHourlyRate } from '../../db/repositories/analytics';
import { formatLifeCost } from '../../utils/lifeCost';
import { useSettingsStore } from '../../state/useSettingsStore';
import { Button } from '../../components/Button';
import { getRecurringRuleForEntity, RecurringRuleRow } from '../../db/repositories/recurring';
import { formatRRule } from '../../utils/recurring';
import { getReceiptForExpense, ReceiptInboxRow } from '../../db/repositories/receipts';

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
  const params = route.params as { id: string } | undefined;
  const [expense, setExpense] = useState<ExpenseListRow | null>(null);
  const [lifeCost, setLifeCost] = useState<string | null>(null);
  const [recurringRule, setRecurringRule] = useState<RecurringRuleRow | null>(null);
  const [receipt, setReceipt] = useState<ReceiptInboxRow | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [budgetMeta, setBudgetMeta] = useState<BudgetMeta | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null);
  const { fixedHourlyRateMinor, hoursPerDay } = useSettingsStore();

  useFocusEffect(
    useCallback(() => {
      if (!params?.id) return;
      let active = true;

      const load = async () => {
        const [row, hourly, recurring, linkedReceipt] = await Promise.all([
          getExpense(params.id),
          getEffectiveHourlyRate(),
          getRecurringRuleForEntity('expense', params.id),
          getReceiptForExpense(params.id),
        ]);

        if (!active) return;

        setExpense(row);
        setRecurringRule(recurring);
        setReceipt(linkedReceipt);
        setLifeCost(null);
        setBudgetMeta(null);
        setCategoryStats(null);

        const fallback = fixedHourlyRateMinor > 0 ? fixedHourlyRateMinor : null;
        const rate = hourly.hourly_rate_minor ?? fallback;
        if (row && rate) {
          setLifeCost(formatLifeCost(row.amount_minor, rate, hoursPerDay));
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
          const impactPct = Math.max(0, Math.round((row.amount_minor / budget.amount_minor) * 100));
          setBudgetMeta({
            periodLabel,
            budgetAmountMinor: budget.amount_minor,
            spentTotalMinor: spentTotal,
            impactPct,
          });
        }

        if (categoryExpenses.length) {
          const total = categoryExpenses.reduce((sum, item) => sum + item.amount_minor, 0);
          const averageMinor = Math.round(total / categoryExpenses.length);
          const maxMinor = categoryExpenses.reduce(
            (max, item) => Math.max(max, item.amount_minor),
            0,
          );
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

  const budgetImpactText = useMemo(() => {
    if (!expense) return null;
    if (!budgetMeta) {
      return 'Set a budget to see the impact here.';
    }
    return `${budgetMeta.impactPct}% of your ${budgetMeta.periodLabel} ${expense.category_name} budget`;
  }, [budgetMeta, expense]);

  const insightItems = useMemo(() => {
    if (!expense) return [];
    const items: string[] = [];
    if (budgetMeta) {
      const remaining = budgetMeta.budgetAmountMinor - budgetMeta.spentTotalMinor;
      items.push(
        `Spent ${formatMinor(
          budgetMeta.spentTotalMinor,
          expense.account_currency,
        )} ${budgetMeta.periodLabel} to date.`,
      );
      if (remaining >= 0) {
        items.push(
          `${formatMinor(
            remaining,
            expense.account_currency,
          )} left in this budget after this expense.`,
        );
      } else {
        items.push(
          `Over budget by ${formatMinor(
            Math.abs(remaining),
            expense.account_currency,
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
            expense.account_currency,
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

    if (!items.length) {
      items.push('Add a budget for this category to unlock smarter insights.');
    }

    return items.slice(0, 3);
  }, [budgetMeta, categoryStats, expense]);

  if (!expense) {
    return (
      <View className="flex-1 bg-app-bg dark:bg-app-bg-dark items-center justify-center">
        <Text className="text-sm text-app-muted dark:text-app-muted-dark">Loading...</Text>
      </View>
    );
  }

  const categoryGlyph =
    expense.category_icon?.trim() || expense.category_name?.trim()?.slice(0, 1) || 'C';
  const categoryBorder = expense.category_color || (isDark ? '#3A254F' : '#F2C7E3');

  return (
    <>
      <ScrollView
        className="flex-1 bg-app-bg dark:bg-app-bg-dark"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
      >
        <Card className="mb-4 border-0 bg-app-soft dark:bg-app-soft-dark">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              
              <View className="ml-3 ">
                <Text className="text-base bg-app-brand dark:bg-app-brand-dark px-3 py-1 rounded-full font-display dark:text-app-text text-app-text-dark mt-1">
                  {expense.category_name}
                </Text>
              </View>
            </View>
            <Pressable
              className="h-10 w-10 rounded-full items-center justify-center bg-app-surface dark:bg-app-surface-dark"
              onPress={() => setMenuOpen(true)}
            >
              <Feather
                name="more-horizontal"
                size={18}
                color={isDark ? '#F9E6F4' : '#2C0C4D'}
              />
            </Pressable>
          </View>

          <Text className="text-[12vw] font-black text-app-brand dark:text-app-brand-dark mt-5 text-center">
            {formatSigned(-expense.amount_minor, expense.account_currency)}
          </Text>
          <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-2 text-center">
            {expense.title}
          </Text>
          {budgetImpactText ? (
            <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-2 text-center">
              {budgetImpactText}
            </Text>
          ) : null}
          <View className="flex-row items-center justify-center mt-4">
            {lifeCost ? (
              <LifeCostPill value={lifeCost} />
            ) : (
              <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                Set hourly rate
              </Text>
            )}
            <View className="h-3 w-px bg-app-border dark:bg-app-border-dark mx-3" />
            <Text className="text-xs text-app-muted dark:text-app-muted-dark">
              {formatDate(expense.date_ts)}
            </Text>
          </View>
        </Card>

        <Card className="mb-4 border-0">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-[11px] uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
                Category
              </Text>
              <Text className="text-sm font-display text-app-text dark:text-app-text-dark mt-1">
                {expense.category_name}
              </Text>
            </View>
            <View className="h-10 w-px bg-app-border dark:bg-app-border-dark mx-3" />
            <View className="flex-1">
              <Text className="text-[11px] uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
                Account
              </Text>
              <Text className="text-sm font-display text-app-text dark:text-app-text-dark mt-1">
                {expense.account_name}
              </Text>
            </View>
            <View className="h-10 w-px bg-app-border dark:bg-app-border-dark mx-3" />
            <View className="flex-1">
              <Text className="text-[11px] uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
                Date
              </Text>
              <Text className="text-sm font-display text-app-text dark:text-app-text-dark mt-1">
                {formatDate(expense.date_ts)}
              </Text>
            </View>
          </View>
        </Card>

        <Card className="mb-4 border-0">
          <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
            How did this feel?
          </Text>
          <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-2">{regretLabel}</Text>
          <Slider
            value={expense.slider_0_100}
            minimumValue={0}
            maximumValue={100}
            step={25}
            disabled
            minimumTrackTintColor={isDark ? '#7D3AE6' : '#5C2AAE'}
            maximumTrackTintColor={isDark ? '#352146' : '#EBD1E3'}
            thumbTintColor={isDark ? '#7D3AE6' : '#5C2AAE'}
            style={{ marginTop: 12 }}
          />
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-xs text-app-muted dark:text-app-muted-dark">Regret</Text>
            <Text className="text-xs text-app-muted dark:text-app-muted-dark">Worth it</Text>
          </View>
        </Card>

        <View className="flex-row flex-wrap gap-2 mb-4">
          {recurringRule ? (
            <View className="px-3 py-2 rounded-full bg-app-soft dark:bg-app-soft-dark">
              <Text className="text-xs text-app-text dark:text-app-text-dark">
                Recurring: {formatRRule(recurringRule.rrule_text)}
              </Text>
            </View>
          ) : null}
          {recurringRule && !recurringRule.active ? (
            <View className="px-3 py-2 rounded-full bg-app-soft dark:bg-app-soft-dark">
              <Text className="text-xs text-app-muted dark:text-app-muted-dark">Paused</Text>
            </View>
          ) : null}
          {receipt ? (
            <View className="px-3 py-2 rounded-full bg-app-soft dark:bg-app-soft-dark">
              <Text className="text-xs text-app-text dark:text-app-text-dark">Receipt attached</Text>
            </View>
          ) : null}
          {expense.notes ? (
            <View className="px-3 py-2 rounded-full bg-app-soft dark:bg-app-soft-dark">
              <Text className="text-xs text-app-text dark:text-app-text-dark">Notes</Text>
            </View>
          ) : null}
        </View>

        {expense.notes ? (
          <Card className="mb-4 border-0">
            <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
              Notes
            </Text>
            <Text className="text-base text-app-text dark:text-app-text-dark mt-2">
              {expense.notes}
            </Text>
          </Card>
        ) : null}

        {insightItems.length ? (
          <Card className="mb-4 border-0 bg-app-soft dark:bg-app-soft-dark">
            <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
              Insights
            </Text>
            <View className="mt-3">
              {insightItems.map((item, index) => (
                <Text
                  key={`${expense.id}-insight-${index}`}
                  className="text-sm text-app-text dark:text-app-text-dark mt-2"
                >
                  - {item}
                </Text>
              ))}
            </View>
          </Card>
        ) : null}

        {receipt ? (
          <Card className="mb-4 border-0">
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

        <View className="mt-2">
          <Text className="text-xs text-app-muted dark:text-app-muted-dark">
            Created {formatDateTime(expense.created_at)}. Updated {formatDateTime(expense.updated_at)}.
          </Text>
        </View>

        <View className="mt-6">
          <Button
            title="Edit expense"
            variant="primary"
            onPress={() => navigation.navigate('AddExpense' as never, { id: expense.id } as never)}
          />
        </View>
      </ScrollView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="flex-1" onPress={() => setMenuOpen(false)} />
          <View className="bg-app-surface dark:bg-app-surface-dark p-5 rounded-t-3xl">
            <Text className="text-sm font-display text-app-text dark:text-app-text-dark">
              More actions
            </Text>
            <Pressable
              className="mt-4 rounded-2xl bg-app-soft dark:bg-app-soft-dark px-4 py-3"
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate('AddExpense' as never, { id: expense.id } as never);
              }}
            >
              <Text className="text-sm text-app-text dark:text-app-text-dark">Edit expense</Text>
            </Pressable>
            <Pressable
              className="mt-3 rounded-2xl bg-app-soft dark:bg-app-soft-dark px-4 py-3"
              onPress={() => {
                setMenuOpen(false);
                Alert.alert('Delete expense?', 'This action cannot be undone.', [
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
              }}
            >
              <Text className="text-sm text-app-danger">Delete expense</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
