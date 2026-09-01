import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';

import { PressableScale } from '../../components/PressableScale';
import { useSettingsStore } from '../../state/useSettingsStore';
import { generateSampleData } from '../../db/sampleData';
import { listAccountsWithBalances } from '../../db/repositories/accounts';
import { listCurrencies } from '../../db/repositories/currencies';
import { formatSigned } from '../../utils/money';
import { buildRateMap, convertMinorToBase } from '../../utils/currency';
import { deleteAllUserData } from '../../services/dataReset';
import { Button } from '../../components/Button';

const SUPPORT_EMAIL = 'aminbihamtawork@gmail.com';
const TERMS_URL = 'https://worthy.aminbihamta.com/terms';

function SettingsSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      {title && (
        <Text className="px-4 mb-2 text-xs font-medium uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
          {title}
        </Text>
      )}
      <View className="bg-app-card dark:bg-app-card-dark rounded-3xl overflow-hidden border border-app-border/50 dark:border-app-border-dark/50">
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  isLast = false,
  isDestructive = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  isLast?: boolean;
  isDestructive?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <PressableScale onPress={onPress}>
      <View
        className={`flex-row items-center justify-between p-4 ${
          !isLast ? 'border-b border-app-border/30 dark:border-app-border-dark/30' : ''
        }`}
      >
        <View className="flex-row items-center gap-4">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDestructive ? 'bg-app-danger/10' : 'bg-app-soft dark:bg-app-soft-dark'
            }`}
          >
            <Feather
              name={icon}
              size={18}
              color={isDestructive ? '#EF4444' : isDark ? '#F9E6F4' : '#2C0C4D'}
            />
          </View>
          <Text
            className={`text-base font-medium ${
              isDestructive ? 'text-app-danger' : 'text-app-text dark:text-app-text-dark'
            }`}
          >
            {label}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {value && (
            <Text className="text-base text-app-muted dark:text-app-muted-dark">{value}</Text>
          )}
          <Feather name="chevron-right" size={16} color={isDark ? '#C8A9C2' : '#8A6B9A'} />
        </View>
      </View>
    </PressableScale>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { themeMode, setThemeMode, baseCurrency } = useSettingsStore();
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof listAccountsWithBalances>>>(
    [],
  );
  const [rateMap, setRateMap] = useState<Map<string, number>>(new Map());
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingData, setDeletingData] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadBalances = useCallback(async () => {
    try {
      const [accountRows, currencyRows] = await Promise.all([
        listAccountsWithBalances(),
        listCurrencies(),
      ]);
      setAccounts(accountRows);
      setRateMap(buildRateMap(currencyRows, baseCurrency));
    } catch (error) {
      if (__DEV__) {
        console.error('[SettingsScreen] load balances failed', error);
      }
    }
  }, [baseCurrency]);

  useFocusEffect(
    useCallback(() => {
      loadBalances();
    }, [loadBalances]),
  );

  const cycleTheme = () => {
    const modes: ('system' | 'light' | 'dark')[] = ['system', 'light', 'dark'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
    Haptics.selectionAsync();
  };

  const themeLabel = themeMode.charAt(0).toUpperCase() + themeMode.slice(1);
  const totalBalance = accounts.reduce((sum, account) => {
    const balanceMinor = account.balance_minor ?? account.starting_balance_minor;
    return sum + convertMinorToBase(balanceMinor, account.currency, rateMap, baseCurrency);
  }, 0);
  const balanceCurrency = baseCurrency || accounts[0]?.currency || 'USD';
  const accountLabel =
    accounts.length === 0
      ? 'No accounts yet'
      : `${accounts.length} account${accounts.length > 1 ? 's' : ''}`;

  const openDeleteModal = () => {
    setDeleteConfirmation('');
    setDeleteError(null);
    setDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    if (deletingData) return;
    setDeleteModalVisible(false);
    setDeleteConfirmation('');
    setDeleteError(null);
  };

  const handleDeleteAllData = async () => {
    if (deleteConfirmation.trim() !== 'DELETE' || deletingData) return;

    setDeletingData(true);
    setDeleteError(null);
    try {
      await deleteAllUserData();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      // Resetting the settings store swaps the root navigator to the intro screen.
    } catch (error) {
      if (__DEV__) {
        console.error('[SettingsScreen] delete all data failed', error);
      }
      setDeleteError('Worthy could not finish deleting all data. Try again.');
      setDeletingData(false);
    }
  };

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}>
        {/* Header */}
        <View className="px-6 mb-8">
          <Text className="text-4xl font-display text-app-text dark:text-app-text-dark">
            Settings
          </Text>
          <Text className="text-base text-app-muted dark:text-app-muted-dark mt-1">
            Preferences & Configuration
          </Text>
        </View>

        <View className="px-4">
          <View className="mb-6">
            <View className="bg-app-card dark:bg-app-card-dark rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 p-5">
              <View>
                <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
                  Total balance
                </Text>
                <Text className="text-2xl font-display text-app-text dark:text-app-text-dark mt-2">
                  {formatSigned(totalBalance, balanceCurrency)}
                </Text>
                <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-2">
                  {accountLabel}
                </Text>
              </View>
            </View>
          </View>

          {/* Appearance */}
          <SettingsSection title="Appearance">
            <PressableScale onPress={cycleTheme}>
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                    <Feather
                      name={themeMode === 'dark' ? 'moon' : 'sun'}
                      size={18}
                      color={isDark ? '#F9E6F4' : '#2C0C4D'}
                    />
                  </View>
                  <Text className="text-base font-medium text-app-text dark:text-app-text-dark">
                    Theme
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-app-muted dark:text-app-muted-dark">
                    {themeLabel}
                  </Text>
                  <Feather name="chevron-right" size={16} color={isDark ? '#C8A9C2' : '#8A6B9A'} />
                </View>
              </View>
            </PressableScale>
          </SettingsSection>

          {/* Management */}
          <SettingsSection title="Management">
            <SettingsRow
              icon="grid"
              label="Widgets"
              onPress={() => navigation.navigate('Widgets' as never)}
            />
            <SettingsRow
              icon="credit-card"
              label="Accounts"
              onPress={() => navigation.navigate('Accounts' as never)}
            />
            <SettingsRow
              icon="globe"
              label="Currencies"
              onPress={() => navigation.navigate('Currencies' as never)}
            />
            <SettingsRow
              icon="tag"
              label="Categories"
              onPress={() => navigation.navigate('Categories' as never)}
            />
            <SettingsRow
              icon="repeat"
              label="Recurring Rules"
              onPress={() => navigation.navigate('Recurring' as never)}
              isLast
            />
          </SettingsSection>

          <SettingsSection title="About">
            <SettingsRow
              icon="mail"
              label="Support"
              value={SUPPORT_EMAIL}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            />
            <SettingsRow
              icon="shield"
              label="Privacy"
              onPress={() => navigation.navigate('Privacy' as never)}
            />
            <SettingsRow
              icon="file-text"
              label="Terms of Service"
              onPress={() => Linking.openURL(TERMS_URL)}
              isLast
            />
          </SettingsSection>

          <SettingsSection title="Data">
            <SettingsRow
              icon="trash-2"
              label="Delete all my data"
              onPress={openDeleteModal}
              isDestructive
              isLast
            />
          </SettingsSection>

          {/* Data */}
          {__DEV__ && (
            <SettingsSection title="Development">
              <SettingsRow
                icon="database"
                label="Generate Sample Data"
                onPress={async () => {
                  await generateSampleData();
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              />
              <SettingsRow
                icon="rotate-ccw"
                label="Reset Onboarding Action"
                onPress={async () => {
                  // This will flip the switch and RootNavigator should take over
                  await useSettingsStore.getState().resetOnboarding();
                }}
                isLast
              />
            </SettingsSection>
          )}

          <View className="items-center mt-4 mb-8">
            <Text className="text-xs text-app-muted dark:text-app-muted-dark">Worthy v1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeDeleteModal}
      >
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={closeDeleteModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            pointerEvents="box-none"
          >
            <Pressable
              className="rounded-t-[32px] bg-app-card dark:bg-app-card-dark px-6 pt-4 pb-10"
              onPress={() => undefined}
              accessibilityViewIsModal
            >
              <View className="items-center pb-5">
                <View className="h-1.5 w-12 rounded-full bg-app-border dark:bg-app-border-dark" />
              </View>

              <View className="h-14 w-14 rounded-2xl bg-app-danger/10 items-center justify-center mb-5">
                <Feather name="trash-2" size={24} color="#EF4444" />
              </View>

              <Text className="text-2xl font-display text-app-text dark:text-app-text-dark">
                Delete all your data?
              </Text>
              <Text className="text-sm leading-6 text-app-muted dark:text-app-muted-dark mt-3">
                This permanently deletes every account, transaction, budget, currency, preference,
                and recurring rule. This cannot be undone.
              </Text>

              <Text className="text-sm font-medium text-app-text dark:text-app-text-dark mt-6 mb-2">
                Type DELETE to confirm
              </Text>
              <TextInput
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                editable={!deletingData}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="DELETE"
                placeholderTextColor={isDark ? '#8B949E' : '#8A6B9A'}
                className="rounded-2xl border border-app-border dark:border-app-border-dark bg-app-bg dark:bg-app-bg-dark px-4 py-3 text-base text-app-text dark:text-app-text-dark"
                accessibilityLabel="Type DELETE to confirm data deletion"
              />

              {deleteError ? (
                <Text className="text-sm text-app-danger mt-3" accessibilityRole="alert">
                  {deleteError}
                </Text>
              ) : null}

              <View className="mt-6 gap-3">
                <Button
                  title={deletingData ? 'Deleting everything...' : 'Delete all data'}
                  variant="danger"
                  disabled={deleteConfirmation.trim() !== 'DELETE' || deletingData}
                  onPress={handleDeleteAllData}
                  icon={<Feather name="trash-2" size={18} color="#FFFFFF" />}
                />
                <Button
                  title="Cancel"
                  variant="secondary"
                  disabled={deletingData}
                  onPress={closeDeleteModal}
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}
