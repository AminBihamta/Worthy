import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
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
import { formatShortDate } from '../../utils/time';

class TransactionsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[TransactionsScreen] render error', error);
  }

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 bg-app-bg dark:bg-app-bg-dark items-center justify-center px-6">
          <Text className="text-base font-display text-app-text dark:text-app-text-dark">
            Transactions crashed
          </Text>
          <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-2 text-center">
            {this.state.error.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const { fixedHourlyRateMinor, hoursPerDay } = useSettingsStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [rows, setRows] = useState<Transaction[]>([]);
  const [hourlyRateMinor, setHourlyRateMinor] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const loadIdRef = useRef(0);

  const load = useCallback(async () => {
    const loadId = (loadIdRef.current += 1);
    if (__DEV__) {
      console.log('[TransactionsScreen] load start', { loadId });
    }
    try {
      const [items, hourly] = await Promise.all([listTransactions(), getEffectiveHourlyRate()]);
      if (__DEV__) {
        console.log('[TransactionsScreen] load ok', {
          loadId,
          count: items.length,
          hourly: hourly.hourly_rate_minor ?? null,
        });
      }
      setRows(items);
      const fallback = fixedHourlyRateMinor > 0 ? fixedHourlyRateMinor : null;
      setHourlyRateMinor(hourly.hourly_rate_minor ?? fallback);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (__DEV__) {
        console.error('[TransactionsScreen] load failed', { loadId, message, error });
      }
    }
  }, [fixedHourlyRateMinor]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (__DEV__) {
      console.log('[TransactionsScreen] mounted');
      return () => {
        console.log('[TransactionsScreen] unmounted');
      };
    }
    return;
  }, []);

  const handleDelete = async (item: Transaction) => {
    if (__DEV__) {
      console.log('[TransactionsScreen] delete', { id: item.id, type: item.type });
    }
    if (item.type === 'expense') {
      await deleteExpense(item.id);
    } else if (item.type === 'income') {
      await deleteIncome(item.id);
    } else {
      await deleteTransfer(item.id);
    }
    load();
  };

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter((item) => {
      const haystack = [
        item.title,
        item.category_name,
        item.notes,
        item.account_name,
        item.from_account_name,
        item.to_account_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [rows, query]);

  const hasQuery = query.trim().length > 0;

  const header = (
    <View>
      <View className="mb-4">
        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-2">
          Search
        </Text>
        <View className="rounded-2xl border border-transparent bg-app-soft dark:bg-app-soft-dark px-4 py-3 flex-row items-center">
          <Feather name="search" size={16} color={isDark ? '#9AA2AE' : '#8D929B'} />
          <TextInput
            className="flex-1 text-base text-app-text dark:text-app-text-dark ml-3"
            placeholder="Search transactions"
            placeholderTextColor="#A2A7AF"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>
      {hourlyRateMinor ? null : (
        <View className="mb-4">
          <View className="rounded-3xl border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-4">
            <Text className="text-sm text-app-text dark:text-app-text-dark">
              Set a fixed hourly rate in Settings to unlock life cost details.
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderRow = (item: Transaction) => (
    <View className="mb-4" key={item.id}>
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
          dateLabel={formatShortDate(item.date_ts)}
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
  );

  return (
    <TransactionsErrorBoundary>
      <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
        <FlashList
          data={filteredRows}
          estimatedItemSize={96}
          contentContainerStyle={{ padding: 24 }}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              title={hasQuery ? 'No matches found' : 'No transactions yet'}
              subtitle={
                hasQuery
                  ? 'Try a different keyword or clear your search.'
                  : 'Add an expense or income to start.'
              }
            />
          }
          renderItem={({ item }) => renderRow(item)}
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
          <Feather name="camera" size={18} color={isDark ? '#F5F7FA' : '#101114'} />
          <Text className="ml-2 text-sm font-emphasis text-app-text dark:text-app-text-dark">
            Receipts
          </Text>
        </Pressable>
      </View>
    </TransactionsErrorBoundary>
  );
}
