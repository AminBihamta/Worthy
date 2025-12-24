import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { TransactionRow as Transaction } from '../db/repositories/transactions';
import { formatSigned } from '../utils/money';
import { LifeCostPill } from './LifeCostPill';

export function TransactionRow({
  transaction,
  lifeCost,
  onPress,
}: {
  transaction: Transaction;
  lifeCost?: string | null;
  onPress?: () => void;
}) {
  const amount =
    transaction.type === 'expense' ? -transaction.amount_minor : transaction.amount_minor;
  const currency = transaction.account_currency ?? 'USD';
  const dotColor =
    transaction.type === 'expense'
      ? (transaction.category_color ?? '#101114')
      : transaction.type === 'income'
        ? '#2CB67D'
        : '#FFB347';

  return (
    <Pressable
      className="rounded-3xl border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-4"
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View
            className="h-12 w-12 rounded-full items-center justify-center"
            style={{ backgroundColor: dotColor }}
          >
            <Text className="text-xs text-white font-emphasis">
              {transaction.title.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View className="ml-3 flex-1">
            <Text
              className="text-base font-display text-app-text dark:text-app-text-dark"
              numberOfLines={1}
            >
              {transaction.title}
            </Text>
            <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mt-1">
              {transaction.type}
              {transaction.category_name ? ` · ${transaction.category_name}` : ''}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text
            className={`text-base font-display ${
              transaction.type === 'expense'
                ? 'text-app-danger'
                : transaction.type === 'income'
                  ? 'text-app-success'
                  : 'text-app-text dark:text-app-text-dark'
            }`}
          >
            {formatSigned(amount, currency)}
          </Text>
          {lifeCost ? (
            <View className="mt-2">
              <LifeCostPill value={lifeCost} />
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
