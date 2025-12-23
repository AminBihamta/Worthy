import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Feather } from '@expo/vector-icons';
import {
  listTransactions,
  TransactionRow as Transaction,
} from '../../db/repositories/transactions';
import { deleteExpense } from '../../db/repositories/expenses';
import { deleteIncome } from '../../db/repositories/incomes';
import { deleteTransfer } from '../../db/repositories/transfers';
import { SwipeableRow } from '../../components/SwipeableRow';
import { TransactionRow } from '../../components/TransactionRow';
import { EmptyState } from '../../components/EmptyState';
import { getEffectiveHourlyRate } from '../../db/repositories/analytics';
import { useSettingsStore } from '../../state/useSettingsStore';
import { formatLifeCost } from '../../utils/lifeCost';

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const { fixedHourlyRateMinor, hoursPerDay } = useSettingsStore();
  const [rows, setRows] = useState<Transaction[]>([]);
  const [hourlyRateMinor, setHourlyRateMinor] = useState<number | null>(null);

  const load = useCallback(() => {
    Promise.all([listTransactions(), getEffectiveHourlyRate()]).then(([items, hourly]) => {
      setRows(items);
      const fallback = fixedHourlyRateMinor > 0 ? fixedHourlyRateMinor : null;
      setHourlyRateMinor(hourly.hourly_rate_minor ?? fallback);
    });
  }, [fixedHourlyRateMinor]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = async (item: Transaction) => {
    if (item.type === 'expense') {
      await deleteExpense(item.id);
    } else if (item.type === 'income') {
      await deleteIncome(item.id);
    } else {
      await deleteTransfer(item.id);
    }
    load();
  };

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <FlashList
        data={rows}
        estimatedItemSize={96}
        contentContainerStyle={{ padding: 20 }}
        ListHeaderComponent={
          hourlyRateMinor ? null : (
            <View className="mb-4">
              <View className="rounded-2xl border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-4">
                <Text className="text-sm text-app-text dark:text-app-text-dark">
                  Set a fixed hourly rate in Settings to unlock life cost details.
                </Text>
              </View>
            </View>
          )
        }
        ListEmptyComponent={
          <EmptyState title="No transactions yet" subtitle="Add an expense or income to start." />
        }
        renderItem={({ item }) => (
          <View className="mb-4">
            <SwipeableRow
              onDelete={() => handleDelete(item)}
              onEdit={() => {
                if (item.type === 'expense') {
                  navigation.navigate('AddExpense' as never, { id: item.id } as never);
                } else if (item.type === 'income') {
                  navigation.navigate('AddIncome' as never, { id: item.id } as never);
                }
              }}
            >
              <TransactionRow
                transaction={item}
                lifeCost={
                  item.type === 'expense'
                    ? formatLifeCost(item.amount_minor, hourlyRateMinor, hoursPerDay)
                    : null
                }
                onPress={() => {
                  if (item.type === 'expense') {
                    navigation.navigate('ExpenseDetail' as never, { id: item.id } as never);
                  } else if (item.type === 'income') {
                    navigation.navigate('IncomeDetail' as never, { id: item.id } as never);
                  }
                }}
              />
            </SwipeableRow>
          </View>
        )}
      />
      <Pressable
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-app-brand dark:bg-app-brand-dark items-center justify-center shadow"
        onPress={() => navigation.navigate('AddExpense' as never)}
      >
        <Feather name="plus" size={26} color="#FFFFFF" />
      </Pressable>
      <Pressable
        className="absolute bottom-6 left-6 h-14 px-4 rounded-full bg-app-surface dark:bg-app-surface-dark border border-app-border dark:border-app-border-dark flex-row items-center"
        onPress={() => navigation.navigate('ReceiptInbox' as never)}
      >
        <Feather name="camera" size={18} color="#2F6F62" />
        <Text className="ml-2 text-sm font-semibold text-app-text dark:text-app-text-dark">
          Receipts
        </Text>
      </Pressable>
    </View>
  );
}
