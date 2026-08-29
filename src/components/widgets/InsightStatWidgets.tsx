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
    <Card className={size === 'compact' ? 'p-4' : 'p-5'}>
      <View className="flex-row items-start">
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center mr-3"
          style={{ backgroundColor: `${accent}22` }}
        >
          <Feather name="trending-up" size={22} color={accent} />
        </View>
        <View className="flex-1 min-w-0">
          <Text className={`text-app-muted dark:text-app-muted-dark font-medium ${subLabelClass(size)}`}>
            Income · {monthLabel}
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
        </View>
      </View>
    </Card>
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
    <Card className={size === 'compact' ? 'p-4' : 'p-5'}>
      <View className="flex-row items-start">
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center mr-3"
          style={{ backgroundColor: `${accent}22` }}
        >
          <Feather name="shopping-bag" size={20} color={accent} />
        </View>
        <View className="flex-1 min-w-0">
          <Text className={`text-app-muted dark:text-app-muted-dark font-medium ${subLabelClass(size)}`}>
            Spent today
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
        </View>
      </View>
    </Card>
  );
}
