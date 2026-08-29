import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { PressableScale } from '../../components/PressableScale';
import { ACCOUNT_TYPES, getAccountTypeDefinition } from '../../data/accountTypes';
import type { AccountType } from '../../db/repositories/accounts';
import { getDb } from '../../db';
import { useSettingsStore } from '../../state/useSettingsStore';
import { formatSigned } from '../../utils/money';

interface AccountItem {
  id: string;
  name: string;
  type: AccountType;
  balanceMinor: number;
  currency: string;
}

export default function AccountsSetupScreen({ navigation }: { navigation: any }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { baseCurrency } = useSettingsStore();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);

  const loadAccounts = useCallback(async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      type: AccountType;
      starting_balance_minor: number;
      currency: string;
    }>(
      'SELECT id, name, type, starting_balance_minor, currency FROM accounts WHERE archived_at IS NULL ORDER BY created_at DESC',
    );
    setAccounts(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        balanceMinor: row.starting_balance_minor,
        currency: row.currency,
      })),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [loadAccounts]),
  );

  const addAccount = (type: AccountType, defaultName: string) => {
    navigation.navigate('OnboardingAccountForm', {
      type,
      defaultName,
      currency: baseCurrency,
    });
  };

  const confirmDelete = (account: AccountItem) => {
    Alert.alert(`Remove ${account.name}?`, 'This removes the account from your onboarding setup.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const db = await getDb();
          await db.runAsync('DELETE FROM accounts WHERE id = ?', account.id);
          await loadAccounts();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-5 pb-6">
          <View className="flex-row items-center mb-3">
            <View className="px-3 py-1.5 rounded-full bg-app-soft dark:bg-app-soft-dark">
              <Text className="text-xs font-emphasis text-app-text dark:text-app-text-dark">
                Step 2 of 3
              </Text>
            </View>
          </View>
          <Text className="text-3xl font-display text-app-text dark:text-app-text-dark">
            Where does your money live?
          </Text>
          <Text className="text-sm leading-5 text-app-muted dark:text-app-muted-dark mt-2">
            Add the places you keep or spend money. You can add more and make changes later.
          </Text>
        </View>

        {accounts.length > 0 ? (
          <View className="mb-7">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
                Added accounts
              </Text>
              <Text className="text-xs font-emphasis text-app-brand dark:text-app-brand-dark">
                {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
              </Text>
            </View>
            <View className="gap-3">
              {accounts.map((account) => {
                const definition = getAccountTypeDefinition(account.type);
                return (
                  <View
                    key={account.id}
                    className="flex-row items-center rounded-3xl border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-4"
                  >
                    <View
                      className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                      style={{ backgroundColor: `${definition.accent}1F` }}
                    >
                      <Feather name={definition.icon} size={21} color={definition.accent} />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text
                        numberOfLines={1}
                        className="text-base font-display text-app-text dark:text-app-text-dark"
                      >
                        {account.name}
                      </Text>
                      <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
                        {definition.label} · {account.currency}
                      </Text>
                    </View>
                    <View className="items-end ml-3">
                      <Text className="text-sm font-emphasis text-app-text dark:text-app-text-dark">
                        {formatSigned(account.balanceMinor, account.currency)}
                      </Text>
                      <PressableScale
                        onPress={() => confirmDelete(account)}
                        className="flex-row items-center mt-1.5 py-1"
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${account.name}`}
                      >
                        <Feather name="trash-2" size={14} color={isDark ? '#A0A0A0' : '#6B7A8F'} />
                        <Text className="text-xs text-app-muted dark:text-app-muted-dark ml-1">
                          Remove
                        </Text>
                      </PressableScale>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View className="flex-row items-center rounded-3xl bg-app-soft dark:bg-app-soft-dark p-4 mb-7">
            <View className="w-11 h-11 rounded-2xl bg-app-card dark:bg-app-card-dark items-center justify-center mr-3">
              <Feather name="plus" size={20} color={isDark ? '#EAEAEA' : '#0D1B2A'} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-emphasis text-app-text dark:text-app-text-dark">
                Start with your everyday account
              </Text>
              <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
                Most people begin with their wallet or main bank.
              </Text>
            </View>
          </View>
        )}

        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-3 px-1">
          Choose an account type
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {ACCOUNT_TYPES.map((definition) => (
            <PressableScale
              key={definition.id}
              onPress={() => addAccount(definition.id, definition.defaultName)}
              haptic
              style={{ width: '48.5%' }}
              className="mb-3"
              accessibilityRole="button"
              accessibilityLabel={`Add ${definition.label} account`}
            >
              <View className="min-h-[148px] rounded-3xl border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-4 justify-between">
                <View
                  className="w-11 h-11 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: `${definition.accent}1F` }}
                >
                  <Feather name={definition.icon} size={21} color={definition.accent} />
                </View>
                <View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-display text-app-text dark:text-app-text-dark">
                      {definition.label}
                    </Text>
                    <Feather
                      name="arrow-up-right"
                      size={16}
                      color={isDark ? '#A0A0A0' : '#6B7A8F'}
                    />
                  </View>
                  <Text className="text-xs leading-4 text-app-muted dark:text-app-muted-dark mt-1">
                    {definition.description}
                  </Text>
                </View>
              </View>
            </PressableScale>
          ))}
        </View>
      </ScrollView>

      <View
        style={{ paddingBottom: insets.bottom + 16 }}
        className="absolute bottom-0 left-0 right-0 border-t border-app-border dark:border-app-border-dark bg-app-surface dark:bg-app-surface-dark px-5 pt-4"
      >
        <Button
          title={accounts.length > 0 ? 'Continue to categories' : 'Skip for now'}
          onPress={() => navigation.navigate('CategorySetup')}
          variant="primary"
          icon={
            accounts.length > 0 ? (
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            ) : undefined
          }
        />
      </View>
    </View>
  );
}
