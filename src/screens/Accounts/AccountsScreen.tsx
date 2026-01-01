import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';

import { listAccountsWithBalances, archiveAccount } from '../../db/repositories/accounts';
import { listCurrencies } from '../../db/repositories/currencies';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { SwipeableRow } from '../../components/SwipeableRow';
import { EmptyState } from '../../components/EmptyState';
import { PressableScale } from '../../components/PressableScale';
import { formatSigned } from '../../utils/money';
import { useSettingsStore } from '../../state/useSettingsStore';
import { buildRateMap, convertMinorToBase } from '../../utils/currency';

class AccountsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[AccountsScreen] render error', error);
  }

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 bg-app-bg dark:bg-app-bg-dark items-center justify-center px-6">
          <Text className="text-base font-display text-app-text dark:text-app-text-dark">
            Accounts crashed
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

const accountIcons: Record<string, keyof typeof Feather.glyphMap> = {
  cash: 'dollar-sign',
  bank: 'credit-card',
  ewallet: 'smartphone',
  credit: 'credit-card',
};

const formatType = (type: string) => {
  if (type === 'ewallet') return 'E-wallet';
  if (type === 'credit') return 'Credit card';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export default function AccountsScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { baseCurrency } = useSettingsStore();
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof listAccountsWithBalances>>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rateMap, setRateMap] = useState<Map<string, number>>(new Map());

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [items, currencyRows] = await Promise.all([
        listAccountsWithBalances(),
        listCurrencies(),
      ]);
      setAccounts(items);
      setRateMap(buildRateMap(currencyRows, baseCurrency));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLoadError(message);
      if (__DEV__) {
        console.error('[AccountsScreen] load failed', { message, error });
      }
    }
  }, [baseCurrency]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totalBalance = accounts.reduce((sum, account) => {
    const balanceMinor = account.balance_minor ?? account.starting_balance_minor;
    return sum + convertMinorToBase(balanceMinor, account.currency, rateMap, baseCurrency);
  }, 0);
  const primaryCurrency = baseCurrency || accounts[0]?.currency || 'USD';
  const currencySet = new Set(accounts.map((account) => account.currency));
  const hasMixedCurrencies = currencySet.size > 1;

  const renderAccount = (account: Awaited<ReturnType<typeof listAccountsWithBalances>>[number]) => {
    const icon = accountIcons[account.type] ?? 'credit-card';
    const content = (
      <PressableScale
        haptic
        onPress={() =>
          navigation.navigate('AccountForm' as never, { id: account.id } as never)
        }
      >
        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                <Feather name={icon} size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
              </View>
              <View>
                <Text className="text-base font-display text-app-text dark:text-app-text-dark">
                  {account.name}
                </Text>
                <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
                  {formatType(account.type)} · {account.currency}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-base font-display text-app-text dark:text-app-text-dark">
                {formatSigned(account.balance_minor, account.currency)}
              </Text>
              <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
                Balance
              </Text>
            </View>
          </View>
        </Card>
      </PressableScale>
    );

    return (
      <View key={account.id} className="mb-4">
        <SwipeableRow
          onEdit={() => navigation.navigate('AccountForm' as never, { id: account.id } as never)}
          onDelete={async () => {
            await archiveAccount(account.id);
            load();
          }}
        >
          {content}
        </SwipeableRow>
      </View>
    );
  };

  return (
    <AccountsErrorBoundary>
      <ScrollView
        className="flex-1 bg-app-bg dark:bg-app-bg-dark"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-8 pb-6 items-center">
          <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
            Total balance
          </Text>
          <Text className="text-5xl font-display text-app-text dark:text-app-text-dark mt-3 text-center leading-tight">
            {formatSigned(totalBalance, primaryCurrency)}
          </Text>
          <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-3 text-center">
            {accounts.length === 0
              ? 'No accounts yet'
              : `${accounts.length} account${accounts.length > 1 ? 's' : ''}${
                  hasMixedCurrencies ? ' · Mixed currencies' : ''
                }`}
          </Text>
        </View>

        <View className="px-6">
          {loadError ? (
            <Card className="mb-4 border-app-danger/40">
              <Text className="text-sm text-app-danger">{loadError}</Text>
            </Card>
          ) : null}

          {accounts.length === 0 ? (
            <EmptyState title="No accounts" subtitle="Create your first account to start tracking." />
          ) : (
            accounts.map((account) => renderAccount(account))
          )}
        </View>

        <View className="px-6 mt-6">
          <Button title="Add account" onPress={() => navigation.navigate('AccountForm' as never)} />
        </View>
      </ScrollView>
    </AccountsErrorBoundary>
  );
}
