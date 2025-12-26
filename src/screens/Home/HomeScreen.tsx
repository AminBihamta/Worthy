import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Card } from '../../components/Card';
import { PressableScale } from '../../components/PressableScale';
import { SectionHeader } from '../../components/SectionHeader';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import { getEffectiveHourlyRate } from '../../db/repositories/analytics';
import { getExpenseTotals } from '../../db/repositories/expenses';
import { getIncomeTotals } from '../../db/repositories/incomes';
import { listAccounts } from '../../db/repositories/accounts';
import { listTransactions } from '../../db/repositories/transactions';
import { useSettingsStore } from '../../state/useSettingsStore';
import { formatSigned } from '../../utils/money';
import { getPeriodRange } from '../../utils/period';
import { TransactionRow } from '../../components/TransactionRow';
import { formatShortDate } from '../../utils/time';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const { fixedHourlyRateMinor, hoursPerDay } = useSettingsStore();
  const [summary, setSummary] = useState({ spent: 0, income: 0 });
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof listTransactions>>>([]);
  const [hourlyRateMinor, setHourlyRateMinor] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof listAccounts>>>([]);

  const load = useCallback(() => {
    const now = new Date();
    const range = getPeriodRange(now, 'month');
    Promise.all([
      getExpenseTotals(range.start, range.end),
      getIncomeTotals(range.start, range.end),
      listAccounts(),
      listTransactions({ limit: 5 }),
      getEffectiveHourlyRate(),
    ]).then(([spent, income, accountsRows, recentRows, hourly]) => {
      setSummary({ spent, income });
      setAccounts(accountsRows);
      setRecent(recentRows);
      const fallback = fixedHourlyRateMinor > 0 ? fixedHourlyRateMinor : null;
      setHourlyRateMinor(hourly.hourly_rate_minor ?? fallback);
    });
  }, [fixedHourlyRateMinor]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const primaryAccount = accounts[0] ?? null;
  const balanceCurrency = primaryAccount?.currency ?? 'USD';
  const totalBalance = summary.income - summary.spent;
  const brandColor = colorScheme === 'dark' ? '#8B5CF6' : '#6D28D9';
  const accentColor = colorScheme === 'dark' ? '#67E8F9' : '#22D3EE';
  const cardAccents = useMemo(
    () => [brandColor, accentColor, colorScheme === 'dark' ? '#38BDF8' : '#0EA5E9'],
    [accentColor, brandColor, colorScheme],
  );
  const actions = [
    {
      label: 'Add',
      icon: 'plus' as const,
      color: brandColor,
      onPress: () => navigation.navigate('AddExpense' as never),
    },
    {
      label: 'Income',
      icon: 'arrow-down-left' as const,
      color: '#2CB67D',
      onPress: () => navigation.navigate('AddIncome' as never),
    },
    {
      label: 'Transfer',
      icon: 'repeat' as const,
      color: accentColor,
      onPress: () => navigation.navigate('AddTransfer' as never),
    },
    {
      label: 'Accounts',
      icon: 'credit-card' as const,
      color: colorScheme === 'dark' ? '#A78BFA' : '#8B5CF6',
      onPress: () => navigation.navigate('Accounts' as never),
    },
  ];

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View className="px-6 pt-4 pb-6">
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-sm font-medium text-app-muted dark:text-app-muted-dark mb-1">
                  Total balance
                </Text>
                <AnimatedNumber
                  value={formatSigned(totalBalance, balanceCurrency)}
                  className="text-4xl font-display font-bold text-app-text dark:text-app-text-dark"
                />
              </View>
              <PressableScale onPress={() => navigation.navigate('Settings' as never)}>
                <View className="h-10 w-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center border border-app-border dark:border-app-border-dark">
                  <Feather name="user" size={20} color={brandColor} />
                </View>
              </PressableScale>
            </View>
          </View>

          {/* Accounts Carousel */}
          <View className="mb-8">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
            >
              {accounts.length === 0 ? (
                <PressableScale onPress={() => navigation.navigate('AccountForm' as never)}>
                  <View className="w-72 h-44 rounded-[32px] bg-app-card dark:bg-app-card-dark border border-dashed border-app-border dark:border-app-border-dark items-center justify-center">
                    <Feather name="plus" size={24} color={brandColor} />
                    <Text className="text-sm font-medium text-app-muted dark:text-app-muted-dark mt-2">
                      Add your first account
                    </Text>
                  </View>
                </PressableScale>
              ) : (
                accounts.map((account, index) => {
                  const accent = cardAccents[index % cardAccents.length];
                  const suffix = account.id.slice(-4);
                  return (
                    <PressableScale
                      key={account.id}
                      onPress={() =>
                        navigation.navigate('AccountForm' as never, { id: account.id } as never)
                      }
                      haptic
                    >
                      <View className="w-72 h-44 rounded-[32px] bg-app-text dark:bg-app-card-dark overflow-hidden relative p-6 justify-between shadow-sm">
                         {/* Dark card background for contrast */}
                         <View className="absolute inset-0 bg-[#1C1326] dark:bg-[#241733]" />
                         
                         {/* Decorative Blobs */}
                         <View
                            className="absolute -top-10 -right-10 h-40 w-40 rounded-full blur-2xl"
                            style={{ backgroundColor: accent, opacity: 0.3 }}
                          />
                          <View
                            className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full blur-xl"
                            style={{ backgroundColor: accent, opacity: 0.2 }}
                          />

                        <View className="flex-row justify-between items-center">
                           <View className="flex-row items-center gap-2">
                              <Feather name="credit-card" size={16} color="white" opacity={0.8} />
                              <Text className="text-white/80 text-sm font-medium">{account.name}</Text>
                           </View>
                           <Text className="text-white/60 text-xs font-medium">{account.currency}</Text>
                        </View>

                        <View>
                          <Text className="text-white/60 text-xs mb-1">•••• {suffix}</Text>
                          <Text className="text-3xl font-display font-bold text-white">
                            {formatSigned(account.starting_balance_minor, account.currency)}
                          </Text>
                        </View>
                      </View>
                    </PressableScale>
                  );
                })
              )}
              {accounts.length > 0 && (
                 <PressableScale onPress={() => navigation.navigate('AccountForm' as never)}>
                  <View className="w-20 h-44 rounded-[32px] bg-app-soft dark:bg-app-soft-dark items-center justify-center border border-app-border dark:border-app-border-dark">
                    <Feather name="plus" size={24} color={brandColor} />
                  </View>
                </PressableScale>
              )}
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between px-8 mb-10">
            {actions.map((action) => (
              <PressableScale key={action.label} onPress={action.onPress} haptic>
                <View className="items-center gap-2">
                  <View className="h-16 w-16 rounded-full bg-app-card dark:bg-app-card-dark items-center justify-center shadow-sm border border-app-border dark:border-app-border-dark">
                    <Feather name={action.icon} size={24} color={action.color} />
                  </View>
                  <Text className="text-xs font-medium text-app-text dark:text-app-text-dark">
                    {action.label}
                  </Text>
                </View>
              </PressableScale>
            ))}
          </View>

          {/* Transactions */}
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-app-text dark:text-app-text-dark">
                Transactions
              </Text>
              <PressableScale onPress={() => navigation.navigate('TransactionsStack' as never)}>
                <Text className="text-sm font-medium text-app-brand dark:text-app-brand-dark">
                  See all
                </Text>
              </PressableScale>
            </View>

            <View className="gap-4">
              {recent.length === 0 ? (
                <View className="p-6 rounded-3xl bg-app-card dark:bg-app-card-dark items-center border border-app-border dark:border-app-border-dark">
                  <Text className="text-app-muted dark:text-app-muted-dark text-center">
                    No transactions yet.
                  </Text>
                </View>
              ) : (
                recent.map((item) => (
                  <TransactionRow
                    key={item.id}
                    transaction={item}
                    dateLabel={formatShortDate(item.date_ts)}
                    lifeCost={
                      item.type === 'expense' && hourlyRateMinor
                        ? `${(
                            Math.abs(item.amount_minor) /
                            hourlyRateMinor /
                            (hoursPerDay > 0 ? hoursPerDay : 8)
                          ).toFixed(1)}d`
                        : null
                    }
                    onPress={() => {
                      if (item.type === 'expense') {
                        navigation.navigate(
                          'TransactionsStack' as never,
                          { screen: 'ExpenseDetail', params: { id: item.id } } as never,
                        );
                      } else if (item.type === 'income') {
                        navigation.navigate(
                          'TransactionsStack' as never,
                          { screen: 'IncomeDetail', params: { id: item.id } } as never,
                        );
                      }
                    }}
                  />
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
