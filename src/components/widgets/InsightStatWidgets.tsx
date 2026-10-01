import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Card } from '../Card';
import { formatSigned } from '../../utils/money';

type Size = 'compact' | 'default';

function baseAmountClass(size: Size) {
  return size === 'compact' ? 'text-lg font-display font-bold' : 'text-2xl font-display font-bold';
}

function subLabelClass(size: Size) {
  return size === 'compact' ? 'text-xs' : 'text-sm';
}

type StatCardProps = {
  label: string;
  amountMinor: number;
  currency: string;
  loading?: boolean;
  size?: Size;
  icon: keyof typeof Feather.glyphMap;
  accent: string;
  caption?: string;
};

function StatCard({
  label,
  amountMinor,
  currency,
  loading,
  size = 'default',
  icon,
  accent,
  caption,
}: StatCardProps) {
  return (
    <Card className={size === 'compact' ? 'p-4' : 'p-5'}>
      <View className="flex-row items-start">
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center mr-3"
          style={{ backgroundColor: `${accent}22` }}
        >
          <Feather name={icon} size={20} color={accent} />
        </View>
        <View className="flex-1 min-w-0">
          <Text className={`text-app-muted dark:text-app-muted-dark font-medium ${subLabelClass(size)}`}>
            {label}
          </Text>
          {loading ? (
            <View className="h-8 justify-center mt-0.5">
              <ActivityIndicator size="small" color={accent} />
            </View>
          ) : (
            <Text
              className={`text-app-text dark:text-app-text-dark mt-1 ${baseAmountClass(size)}`}
              numberOfLines={1}
            >
              {formatSigned(amountMinor, currency)}
            </Text>
          )}
          {caption ? (
            <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">{caption}</Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

type BalanceWidgetProps = {
  amountMinor: number;
  currency: string;
  loading?: boolean;
  size?: Size;
};

export function TotalBalanceWidget({
  amountMinor,
  currency,
  loading,
  size = 'default',
}: BalanceWidgetProps) {
  const { colorScheme } = useColorScheme();
  const accent = colorScheme === 'dark' ? '#FF7A45' : '#FF4500';
  return (
    <StatCard
      label="Total balance"
      amountMinor={amountMinor}
      currency={currency}
      loading={loading}
      size={size}
      icon="credit-card"
      accent={accent}
    />
  );
}

type MonthIncomeWidgetProps = {
  monthLabel: string;
  amountMinor: number;
  currency: string;
  loading?: boolean;
  size?: Size;
};

export function MonthIncomeWidget({
  monthLabel,
  amountMinor,
  currency,
  loading,
  size = 'default',
}: MonthIncomeWidgetProps) {
  const { colorScheme } = useColorScheme();
  const accent = colorScheme === 'dark' ? '#3FB950' : '#38B000';

  return (
    <StatCard
      label={`Income · ${monthLabel}`}
      amountMinor={amountMinor}
      currency={currency}
      loading={loading}
      size={size}
      icon="trending-up"
      accent={accent}
    />
  );
}

type MonthExpensesWidgetProps = {
  monthLabel: string;
  amountMinor: number;
  currency: string;
  loading?: boolean;
  size?: Size;
};

export function MonthExpensesWidget({
  monthLabel,
  amountMinor,
  currency,
  loading,
  size = 'default',
}: MonthExpensesWidgetProps) {
  const { colorScheme } = useColorScheme();
  const accent = colorScheme === 'dark' ? '#FFB703' : '#EE9B00';

  return (
    <StatCard
      label={`Expenses · ${monthLabel}`}
      amountMinor={amountMinor}
      currency={currency}
      loading={loading}
      size={size}
      icon="shopping-bag"
      accent={accent}
    />
  );
}

type TodaySpendingWidgetProps = {
  amountMinor: number;
  currency: string;
  loading?: boolean;
  size?: Size;
};

export function TodaySpendingWidget({
  amountMinor,
  currency,
  loading,
  size = 'default',
}: TodaySpendingWidgetProps) {
  const { colorScheme } = useColorScheme();
  const accent = colorScheme === 'dark' ? '#FFB703' : '#EE9B00';

  return (
    <StatCard
      label="Spent today"
      amountMinor={amountMinor}
      currency={currency}
      loading={loading}
      size={size}
      icon="shopping-bag"
      accent={accent}
    />
  );
}

export function QuickAddExpensePreview({ size = 'default' }: { size?: Size }) {
  const { colorScheme } = useColorScheme();
  const accent = colorScheme === 'dark' ? '#FF7A45' : '#FF4500';

  return (
    <Card className={size === 'compact' ? 'p-4' : 'p-5'}>
      <View className="flex-row items-center">
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center mr-3"
          style={{ backgroundColor: accent }}
        >
          <Feather name="plus" size={22} color="#FFFFFF" />
        </View>
        <View className="flex-1 min-w-0">
          <Text className={`text-app-text dark:text-app-text-dark font-display ${baseAmountClass(size)}`}>
            Add expense
          </Text>
          <Text className={`text-app-muted dark:text-app-muted-dark mt-1 ${subLabelClass(size)}`}>
            Opens Worthy to log spending
          </Text>
        </View>
      </View>
    </Card>
  );
}
