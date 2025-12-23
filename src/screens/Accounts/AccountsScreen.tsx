import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { listAccounts, archiveAccount } from '../../db/repositories/accounts';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { SwipeableRow } from '../../components/SwipeableRow';
import { EmptyState } from '../../components/EmptyState';

export default function AccountsScreen() {
  const navigation = useNavigation();
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof listAccounts>>>([]);

  const load = useCallback(() => {
    listAccounts().then(setAccounts);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 20 }}
    >
      {accounts.length === 0 ? (
        <EmptyState title="No accounts" subtitle="Create your first account to start tracking." />
      ) : (
        accounts.map((account) => (
          <View key={account.id} className="mb-4">
            <SwipeableRow
              onEdit={() =>
                navigation.navigate('AccountForm' as never, { id: account.id } as never)
              }
              onDelete={async () => {
                await archiveAccount(account.id);
                load();
              }}
            >
              <Card>
                <Text className="text-base font-semibold text-app-text dark:text-app-text-dark">
                  {account.name}
                </Text>
                <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-1">
                  {account.type} · {account.currency}
                </Text>
              </Card>
            </SwipeableRow>
          </View>
        ))
      )}
      <Button title="Add account" onPress={() => navigation.navigate('AccountForm' as never)} />
    </ScrollView>
  );
}
