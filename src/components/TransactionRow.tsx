import React from 'react';
import { Pressable, Text, View } from 'react-native';
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
  const leftBorderClass =
    transaction.type === 'expense'
      ? 'border-app-danger'
      : transaction.type === 'income'
        ? 'border-app-success'
        : 'border-app-accent';
  const categoryLabel = transaction.category_name ?? '';

  return (
    <Pressable
      className={`rounded-3xl border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-4 border-l-4 ${leftBorderClass}`}
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-start">
            <Text
              className="text-base font-display text-app-text dark:text-app-text-dark flex-1 pr-2"
              numberOfLines={1}
            >
              {transaction.title}
            </Text>
            {categoryLabel ? (
              <View className="rounded-full bg-app-soft dark:bg-app-soft-dark px-2 py-1">
                <Text className="text-[10px] font-emphasis text-app-muted dark:text-app-muted-dark">
                  {categoryLabel}
                </Text>
              </View>
            ) : null}
          </View>
          {dateLabel ? (
            <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-2">
              {dateLabel}
            </Text>
          ) : null}
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
