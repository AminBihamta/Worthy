import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View, LayoutAnimation } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';
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
import { PressableScale } from '../../components/PressableScale';
import { getEffectiveHourlyRate } from '../../db/repositories/analytics';
import { useSettingsStore } from '../../state/useSettingsStore';
import { formatLifeCost } from '../../utils/lifeCost';
import { formatShortDate } from '../../utils/time';
import { formatSigned } from '../../utils/money';

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

type ListItem =
  | { type: 'header'; title: string; id: string }
  | { type: 'transaction'; data: Transaction };

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const { fixedHourlyRateMinor, hoursPerDay } = useSettingsStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [rows, setRows] = useState<Transaction[]>([]);
  const [hourlyRateMinor, setHourlyRateMinor] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const loadIdRef = useRef(0);

  const load = useCallback(async () => {
    const loadId = (loadIdRef.current += 1);
    try {
      const [items, hourly] = await Promise.all([listTransactions(), getEffectiveHourlyRate()]);
      setRows(items);
      const fallback = fixedHourlyRateMinor > 0 ? fixedHourlyRateMinor : null;
      setHourlyRateMinor(hourly.hourly_rate_minor ?? fallback);
    } catch (error) {
      console.error('[TransactionsScreen] load failed', error);
    }
  }, [fixedHourlyRateMinor]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = async (item: Transaction) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (item.type === 'expense') {
      await deleteExpense(item.id);
    } else if (item.type === 'income') {
      await deleteIncome(item.id);
    } else {
      await deleteTransfer(item.id);
    }
    load();
  };

  const { listData, summary } = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let filtered = rows;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((item) => item.type === filterType);
    }

    // Filter by query
    if (normalizedQuery) {
      filtered = filtered.filter((item) => {
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
    }

    // Calculate summary
    const stats = filtered.reduce(
      (acc, item) => {
        if (item.type === 'income') {
          acc.income += item.amount_minor;
        } else if (item.type === 'expense') {
          acc.expense += item.amount_minor;
        }
        return acc;
      },
      { income: 0, expense: 0 },
    );

    // Group by date
    const grouped: ListItem[] = [];
    let lastDate = '';

    filtered.forEach((item) => {
      const date = new Date(item.date_ts);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let dateLabel = formatShortDate(item.date_ts);
      if (date.toDateString() === today.toDateString()) {
        dateLabel = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateLabel = 'Yesterday';
      }

      if (dateLabel !== lastDate) {
        grouped.push({ type: 'header', title: dateLabel, id: `header-${dateLabel}` });
        lastDate = dateLabel;
      }
      grouped.push({ type: 'transaction', data: item });
    });

    return { listData: grouped, summary: stats };
  }, [rows, query, filterType]);

  const hasQuery = query.trim().length > 0;

  const FilterChip = ({
    label,
    value,
  }: {
    label: string;
    value: 'all' | 'expense' | 'income';
  }) => {
    const isActive = filterType === value;
    return (
      <PressableScale
        onPress={() => {
          Haptics.selectionAsync();
          setFilterType(value);
        }}
        className={`px-4 py-2 rounded-full border mr-2 ${
          isActive
            ? 'bg-app-text dark:bg-app-text-dark border-transparent'
            : 'bg-transparent border-app-border dark:border-app-border-dark'
        }`}
      >
        <Text
          className={`text-sm font-medium ${
            isActive
              ? 'text-app-bg dark:text-app-bg-dark'
              : 'text-app-text dark:text-app-text-dark'
          }`}
        >
          {label}
        </Text>
      </PressableScale>
    );
  };

  const header = (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-4xl font-display text-app-text dark:text-app-text-dark">
          Activity
        </Text>
      </View>

      {/* Summary Card */}
      <View className="flex-row gap-4 mb-6">
        <View className="flex-1 bg-app-card dark:bg-app-card-dark p-4 rounded-3xl border border-app-border/50 dark:border-app-border-dark/50">
          <View className="flex-row items-center mb-2">
            <View className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mr-2">
              <Feather name="arrow-down-left" size={16} color="#2CB67D" />
            </View>
            <Text className="text-xs font-medium text-app-muted dark:text-app-muted-dark uppercase tracking-wider">
              Income
            </Text>
          </View>
          <Text className="text-xl font-display text-app-text dark:text-app-text-dark">
            {formatSigned(summary.income, 'USD')}
          </Text>
        </View>
        <View className="flex-1 bg-app-card dark:bg-app-card-dark p-4 rounded-3xl border border-app-border/50 dark:border-app-border-dark/50">
          <View className="flex-row items-center mb-2">
            <View className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mr-2">
              <Feather name="arrow-up-right" size={16} color="#EF4444" />
            </View>
            <Text className="text-xs font-medium text-app-muted dark:text-app-muted-dark uppercase tracking-wider">
              Spent
            </Text>
          </View>
          <Text className="text-xl font-display text-app-text dark:text-app-text-dark">
            {formatSigned(-summary.expense, 'USD')}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View className="rounded-2xl bg-app-soft dark:bg-app-soft-dark px-4 py-3 flex-row items-center mb-4">
        <Feather name="search" size={18} color={isDark ? '#C8A9C2' : '#8A6B9A'} />
        <TextInput
          className="flex-1 text-base font-medium text-app-text dark:text-app-text-dark ml-3"
          placeholder="Search transactions..."
          placeholderTextColor={isDark ? '#C8A9C2' : '#B892C4'}
          value={query}
          onChangeText={(text) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setQuery(text);
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <PressableScale onPress={() => setQuery('')}>
            <Feather name="x-circle" size={18} color={isDark ? '#C8A9C2' : '#8A6B9A'} />
          </PressableScale>
        )}
      </View>

      {/* Filters */}
      <View className="flex-row">
        <FilterChip label="All" value="all" />
        <FilterChip label="Expenses" value="expense" />
        <FilterChip label="Income" value="income" />
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <View className="mt-6 mb-3 px-1">
          <Text className="text-sm font-bold text-app-muted dark:text-app-muted-dark uppercase tracking-widest">
            {item.title}
          </Text>
        </View>
      );
    }

    const transaction = item.data;
    return (
      <View className="mb-3">
        <SwipeableRow
          onDelete={() => handleDelete(transaction)}
          onEdit={() => {
            if (transaction.type === 'expense') {
              navigation.navigate('AddExpense' as never, { id: transaction.id } as never);
            } else if (transaction.type === 'income') {
              navigation.navigate('AddIncome' as never, { id: transaction.id } as never);
            }
          }}
        >
          <TransactionRow
            transaction={transaction}
            lifeCost={
              transaction.type === 'expense'
                ? formatLifeCost(transaction.amount_minor, hourlyRateMinor, hoursPerDay)
                : null
            }
            onPress={() => {
              if (transaction.type === 'expense') {
                navigation.navigate('ExpenseDetail' as never, { id: transaction.id } as never);
              } else if (transaction.type === 'income') {
                navigation.navigate('IncomeDetail' as never, { id: transaction.id } as never);
              }
            }}
          />
        </SwipeableRow>
      </View>
    );
  };

  return (
    <TransactionsErrorBoundary>
      <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
        <FlashList
          data={listData}
          estimatedItemSize={80}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
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
          keyExtractor={(item) => (item.type === 'header' ? item.id : item.data.id)}
          renderItem={renderItem}
          getItemType={(item) => item.type}
        />
        
        {/* Floating Action Buttons */}
        <View className="absolute bottom-6 right-6 flex-row items-center gap-4">
          <PressableScale
            className="h-12 px-5 rounded-full bg-app-surface dark:bg-app-surface-dark border border-app-border dark:border-app-border-dark flex-row items-center shadow-sm"
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate('ReceiptInbox' as never);
            }}
          >
            <Feather name="camera" size={18} color={isDark ? '#F9E6F4' : '#2C0C4D'} />
            <Text className="ml-2 text-sm font-bold text-app-text dark:text-app-text-dark">
              Scan
            </Text>
          </PressableScale>
          
          <PressableScale
            className="h-14 w-14 rounded-full bg-app-brand dark:bg-app-brand-dark items-center justify-center shadow-lg shadow-app-brand/30"
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate('AddExpense' as never);
            }}
          >
            <Feather name="plus" size={28} color="#FFFFFF" />
          </PressableScale>
        </View>
      </View>
    </TransactionsErrorBoundary>
  );
}
