import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/Card';
import { PressableScale } from '../../components/PressableScale';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import { getEffectiveHourlyRate } from '../../db/repositories/analytics';
import { listAccountsWithBalances } from '../../db/repositories/accounts';
import { listCurrencies } from '../../db/repositories/currencies';
import { getFirstTransactionDate, listTransactions } from '../../db/repositories/transactions';
import { getSetting } from '../../db/repositories/settings';
import { useSettingsStore } from '../../state/useSettingsStore';
import { formatSigned } from '../../utils/money';
import { TransactionRow } from '../../components/TransactionRow';
import { formatShortDate } from '../../utils/time';
import { formatLifeCost } from '../../utils/lifeCost';
import { buildRateMap, convertMinorToBase } from '../../utils/currency';
import {
  isWiseAccountName,
  WISE_ACCOUNT_BACKGROUND,
  WISE_ACCOUNT_BACKGROUND_END,
  WISE_ACCOUNT_FOREGROUND,
} from '../../utils/accountBranding';
import { useTutorialTarget } from '../../components/tutorial/TutorialProvider';
import {
  formatWrapTitle,
  getAvailableWrapPeriods,
  getWrapPeriodRange,
  WrapPeriod,
} from '../../utils/wrap';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useColorScheme();
  const { hoursPerDay, baseCurrency } = useSettingsStore();
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof listTransactions>>>([]);
  const [hourlyRateMinor, setHourlyRateMinor] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof listAccountsWithBalances>>>(
    [],
  );
  const [rateMap, setRateMap] = useState<Map<string, number>>(new Map());
  const [wrapPrompt, setWrapPrompt] = useState<{
    period: WrapPeriod;
    title: string;
  } | null>(null);

  // Tutorial Targets
  const balanceTarget = useTutorialTarget('home_balance');
  const transactionsTarget = useTutorialTarget('home_transactions_list');

  const loadWrapPrompt = useCallback(async () => {
    const now = new Date();
    const firstTransactionTs = await getFirstTransactionDate();
    const periods = getAvailableWrapPeriods(firstTransactionTs, now);
    const viewedEntries = await Promise.all(
      periods.map(async (period) => {
        const value = await getSetting(`wrap_last_viewed_${period}`);
        return { period, viewedAt: value ? Number.parseInt(value, 10) : 0 };
      }),
    );
    for (const { period, viewedAt } of viewedEntries) {
      const range = getWrapPeriodRange(period, now);
      if (!viewedAt || viewedAt < range.end) {
        return { period, title: formatWrapTitle(period, range) };
      }
    }
    return null;
  }, []);

  const load = useCallback(() => {
    Promise.all([
      listAccountsWithBalances(),
      listTransactions({ limit: 4 }),
      getEffectiveHourlyRate(),
      listCurrencies(),
      loadWrapPrompt(),
    ]).then(([accountsRows, recentRows, hourly, currencyRows, wrapStatus]) => {
      setAccounts(accountsRows);
      setRecent(recentRows);
      setHourlyRateMinor(hourly.hourly_rate_minor ?? null);
      setRateMap(buildRateMap(currencyRows, baseCurrency));
      setWrapPrompt(wrapStatus);
    });
  }, [baseCurrency, loadWrapPrompt]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const primaryAccount = accounts[0] ?? null;
  const balanceCurrency = baseCurrency || primaryAccount?.currency || 'USD';
  const totalBalance = accounts.reduce((sum, account) => {
    const balanceMinor = account.balance_minor ?? account.starting_balance_minor;
    return sum + convertMinorToBase(balanceMinor, account.currency, rateMap, baseCurrency);
  }, 0);
  const brandColor = colorScheme === 'dark' ? '#58D5D8' : '#0A9396';
  const accentColor = colorScheme === 'dark' ? '#FFB703' : '#EE9B00';
  const cardAccents = useMemo(
    () => [brandColor, accentColor, colorScheme === 'dark' ? '#3FB950' : '#38B000'],
    [accentColor, brandColor, colorScheme],
  );
  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View className="px-6 pt-4 pb-6">
            <View className="flex-row justify-between items-start">
              <View
                ref={balanceTarget.ref}
                onLayout={balanceTarget.onLayout}
                collapsable={false} // Ensure measurement works on Android/optimization
              >
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
                  const isWiseAccount = isWiseAccountName(account.name);
                  return (
                    <PressableScale
                      key={account.id}
                      onPress={() =>
                        navigation.navigate('AccountForm' as never, { id: account.id } as never)
                      }
                      haptic
                    >
                      <View
                        className="w-72 h-44 rounded-[32px] bg-app-text dark:bg-app-card-dark overflow-hidden relative p-6 justify-between shadow-sm"
                        style={isWiseAccount ? { backgroundColor: 'transparent' } : undefined}
                      >
                        {isWiseAccount ? (
                          <LinearGradient
                            colors={[WISE_ACCOUNT_BACKGROUND, WISE_ACCOUNT_BACKGROUND_END]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            pointerEvents="none"
                            style={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              bottom: 0,
                              left: 0,
                              borderRadius: 32,
                              overflow: 'hidden',
                            }}
                          />
                        ) : null}
                        {!isWiseAccount ? (
                          <>
                            <View className="absolute inset-0 bg-[#0D1B2A] dark:bg-[#1C2432]" />
                            <View
                              className="absolute -top-10 -right-10 h-40 w-40 rounded-full blur-2xl"
                              style={{ backgroundColor: accent, opacity: 0.3 }}
                            />
                            <View
                              className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full blur-xl"
                              style={{ backgroundColor: accent, opacity: 0.2 }}
                            />
                          </>
                        ) : null}

                        <View className="flex-row justify-between items-center">
                          <View className="flex-row items-center gap-2">
                            <Feather
                              name="credit-card"
                              size={16}
                              color={isWiseAccount ? WISE_ACCOUNT_FOREGROUND : 'white'}
                            />
                            <Text
                              className="text-white/80 text-sm font-medium"
                              style={isWiseAccount ? { color: WISE_ACCOUNT_FOREGROUND } : undefined}
                            >
                              {account.name}
                            </Text>
                          </View>
                          <Text
                            className="text-white/60 text-xs font-medium"
                            style={isWiseAccount ? { color: WISE_ACCOUNT_FOREGROUND } : undefined}
                          >
                            {account.currency}
                          </Text>
                        </View>

                        <View>
                          <Text
                            className="text-3xl font-display font-bold text-white"
                            style={isWiseAccount ? { color: WISE_ACCOUNT_FOREGROUND } : undefined}
                          >
                            {formatSigned(account.balance_minor, account.currency)}
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

          {wrapPrompt ? (
            <View className="px-6 mb-10">
              <PressableScale
                onPress={() =>
                  navigation.navigate(
                    'InsightsStack' as never,
                    { screen: 'Wrapped', params: { period: wrapPrompt.period } } as never,
                  )
                }
              >
                <Card className="overflow-hidden">
                  <View className="absolute -top-12 -right-8 w-32 h-32 rounded-full bg-app-brand/20 dark:bg-app-brand-dark/20" />
                  <View className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-app-soft dark:bg-app-soft-dark" />
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="w-12 h-12 rounded-2xl bg-app-brand dark:bg-app-brand-dark items-center justify-center">
                        <Feather name="star" size={20} color="#FFFFFF" />
                      </View>
                      <View>
                        <Text className="text-base font-medium text-app-text dark:text-app-text-dark">
                          Your {wrapPrompt.period} wrap is ready
                        </Text>
                        <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-1">
                          {wrapPrompt.title}
                        </Text>
                      </View>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={colorScheme === 'dark' ? '#8B949E' : '#6B7A8F'}
                    />
                  </View>
                </Card>
              </PressableScale>
            </View>
          ) : null}

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

            <View
              className="gap-4"
              ref={transactionsTarget.ref}
              onLayout={transactionsTarget.onLayout}
              collapsable={false}
            >
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
                      item.type === 'expense'
                        ? formatLifeCost(
                            convertMinorToBase(
                              item.amount_minor,
                              item.account_currency,
                              rateMap,
                              baseCurrency,
                            ),
                            hourlyRateMinor,
                            hoursPerDay,
                          )
                        : null
                    }
                    onPress={() => {
                      if (item.type === 'expense') {
                        navigation.navigate(
                          'TransactionsStack' as never,
                          {
                            screen: 'ExpenseDetail',
                            params: { id: item.id, origin: 'home' },
                          } as never,
                        );
                      } else if (item.type === 'income') {
                        navigation.navigate(
                          'TransactionsStack' as never,
                          {
                            screen: 'IncomeDetail',
                            params: { id: item.id, origin: 'home' },
                          } as never,
                        );
                      }
                    }}
                  />
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>
      {/* Removed local TutorialOverlay */}
    </View>
  );
}
