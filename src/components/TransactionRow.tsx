import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { SlideInRight } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { TransactionRow as Transaction } from '../db/repositories/transactions';
import { formatSigned } from '../utils/money';
import { LifeCostPill } from './LifeCostPill';

export function TransactionRow({
  transaction,
  lifeCost,
  onPress,
  dateLabel,
}: {
  transaction: Transaction;
  lifeCost?: string | null;
  onPress?: () => void;
  dateLabel?: string;
}) {
  const amount =
    transaction.type === 'expense' ? -transaction.amount_minor : transaction.amount_minor;
  const currency = transaction.account_currency ?? 'USD';

  let iconName: keyof typeof Feather.glyphMap = 'dollar-sign';
  let iconColor = '#0A9396';
  let iconBg = 'bg-app-soft dark:bg-app-soft-dark';

  if (transaction.type === 'expense') {
    iconName = 'arrow-up-right';
    iconColor = '#D62828';
    iconBg = 'bg-red-50 dark:bg-red-900/20';
  } else if (transaction.type === 'income') {
    iconName = 'arrow-down-left';
    iconColor = '#38B000';
    iconBg = 'bg-green-50 dark:bg-green-900/20';
  } else {
    iconName = 'repeat';
    iconColor = '#0A9396';
    iconBg = 'bg-teal-50 dark:bg-teal-900/20';
  }

  const categoryLabel = transaction.category_name ?? '';

  return (
    <Animated.View entering={SlideInRight.duration(500)}>
      <Pressable
        className="flex-row items-center p-4 bg-app-card dark:bg-app-card-dark rounded-2xl shadow-sm border border-app-border/50 dark:border-app-border-dark/50"
        onPress={onPress}
      >
        <View className={`h-12 w-12 rounded-full items-center justify-center mr-4 ${iconBg}`}>
          <Feather name={iconName} size={20} color={iconColor} />
        </View>

        <View className="flex-1 pr-2">
          <Text
            className="text-base font-medium text-app-text dark:text-app-text-dark"
            numberOfLines={1}
          >
            {transaction.title}
          </Text>
          <View className="flex-row items-center mt-1">
            {dateLabel ? (
              <Text className="text-xs text-app-muted dark:text-app-muted-dark mr-2">
                {dateLabel}
              </Text>
            ) : null}
            {categoryLabel ? (
              <Text className="text-xs text-app-muted dark:text-app-muted-dark" numberOfLines={1}>
                {dateLabel ? '• ' : ''}
                {categoryLabel}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="items-end">
          <Text
            className={`text-base font-bold ${
              transaction.type === 'income'
                ? 'text-app-success'
                : 'text-app-text dark:text-app-text-dark'
            }`}
          >
            {formatSigned(amount, currency)}
          </Text>
          {lifeCost ? (
            <View className="mt-1">
              <LifeCostPill value={lifeCost} />
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}
