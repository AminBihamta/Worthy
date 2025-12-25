import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { listAccounts, archiveAccount } from '../../db/repositories/accounts';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { SwipeableRow } from '../../components/SwipeableRow';
import { EmptyState } from '../../components/EmptyState';

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

export default function AccountsScreen() {
  const navigation = useNavigation();
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof listAccounts>>>([]);
  const [debugStage, setDebugStage] = useState('idle');
  const [debugMessage, setDebugMessage] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [debugDisableSwipe, setDebugDisableSwipe] = useState(__DEV__ ? true : false);
  const loadIdRef = useRef(0);

  const load = useCallback(async () => {
    const loadId = (loadIdRef.current += 1);
    if (__DEV__) {
      console.log('[AccountsScreen] load start', { loadId });
    }
    setDebugStage('loading');
    setDebugMessage('Fetching accounts...');
    setLoadError(null);
    try {
      const items = await listAccounts();
      setAccounts(items);
      setDebugStage('ready');
      setDebugMessage(`Loaded ${items.length} accounts`);
      if (__DEV__) {
        console.log('[AccountsScreen] load ok', { loadId, count: items.length });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setDebugStage('error');
      setDebugMessage('Load failed');
      setLoadError(message);
      if (__DEV__) {
        console.error('[AccountsScreen] load failed', { loadId, message, error });
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (__DEV__) {
      console.log('[AccountsScreen] mounted');
      return () => {
        console.log('[AccountsScreen] unmounted');
      };
    }
    return;
  }, []);

  useEffect(() => {
    if (__DEV__) {
      console.log('[AccountsScreen] debug flags', { disableSwipe: debugDisableSwipe });
    }
  }, [debugDisableSwipe]);

  const renderAccount = (account: Awaited<ReturnType<typeof listAccounts>>[number]) => {
    const content = (
      <Card>
        <Text className="text-base font-display text-app-text dark:text-app-text-dark">
          {account.name}
        </Text>
        <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-1">
          {account.type} · {account.currency}
        </Text>
      </Card>
    );

    if (debugDisableSwipe) {
      return (
        <Pressable
          onPress={() =>
            navigation.navigate('AccountForm' as never, { id: account.id } as never)
          }
        >
          {content}
        </Pressable>
      );
    }

    return (
      <SwipeableRow
        onEdit={() => navigation.navigate('AccountForm' as never, { id: account.id } as never)}
        onDelete={async () => {
          await archiveAccount(account.id);
          load();
        }}
      >
        {content}
      </SwipeableRow>
    );
  };

  return (
    <AccountsErrorBoundary>
      <ScrollView
        className="flex-1 bg-app-bg dark:bg-app-bg-dark"
        contentContainerStyle={{ padding: 24 }}
      >
        {__DEV__ ? (
          <Card className="mb-4">
            <Text className="text-xs text-app-muted dark:text-app-muted-dark">
              Debug: {debugStage}
            </Text>
            {debugMessage ? (
              <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
                {debugMessage}
              </Text>
            ) : null}
            {loadError ? (
              <Text className="text-xs text-app-danger mt-1">Error: {loadError}</Text>
            ) : null}
            <View className="flex-row gap-2 mt-3">
              <Pressable
                onPress={() => setDebugDisableSwipe((value) => !value)}
                className="rounded-full px-3 py-2 bg-app-soft dark:bg-app-soft-dark"
              >
                <Text className="text-xs text-app-text dark:text-app-text-dark">
                  Swipe: {debugDisableSwipe ? 'off' : 'on'}
                </Text>
              </Pressable>
            </View>
          </Card>
        ) : null}

        {accounts.length === 0 ? (
          <EmptyState title="No accounts" subtitle="Create your first account to start tracking." />
        ) : (
          accounts.map((account) => (
            <View key={account.id} className="mb-4">
              {renderAccount(account)}
            </View>
          ))
        )}
        <Button title="Add account" onPress={() => navigation.navigate('AccountForm' as never)} />
      </ScrollView>
    </AccountsErrorBoundary>
  );
}
