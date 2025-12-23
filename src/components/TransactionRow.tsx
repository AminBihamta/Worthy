import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { TransactionRow as Transaction } from '../db/repositories/transactions';
import { formatSigned } from '../utils/money';
import { LifeCostPill } from './LifeCostPill';

const typeBadge = {
  expense: 'bg-app-danger/10 text-app-danger',
  income: 'bg-app-brand/10 text-app-brand',
  transfer: 'bg-app-accent/15 text-app-accent',
};

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

  return (
    <Pressable
      className="rounded-2xl border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-4"
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text
            className="text-base font-semibold text-app-text dark:text-app-text-dark"
            numberOfLines={1}
          >
            {transaction.title}
          </Text>
          <View className="flex-row items-center mt-2">
            <View className={`rounded-full px-2 py-1 ${typeBadge[transaction.type]}`}>
              <Text className="text-xs font-semibold">
                {transaction.type === 'expense'
                  ? 'Expense'
                  : transaction.type === 'income'
                    ? 'Income'
                    : 'Transfer'}
              </Text>
            </View>
            {transaction.category_name ? (
              <Text className="ml-2 text-xs text-app-muted dark:text-app-muted-dark">
                {transaction.category_name}
              </Text>
            ) : null}
          </View>
        </View>
        <View className="items-end">
          <Text
            className={`text-base font-semibold ${
              transaction.type === 'expense'
                ? 'text-app-danger'
                : transaction.type === 'income'
                  ? 'text-app-brand'
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
