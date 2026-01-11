import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';

import { Button } from '../../components/Button';
import { PressableScale } from '../../components/PressableScale';
import {
  AccountType,
  createAccount,
  getAccount,
  getAccountBalance,
  updateAccount,
} from '../../db/repositories/accounts';
import { CurrencyRow, listCurrencies } from '../../db/repositories/currencies';
import { useSettingsStore } from '../../state/useSettingsStore';
import { formatAmountInput, formatMinorInput, formatSigned, toMinor } from '../../utils/money';

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { id: string; name: string; subtitle?: string }[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const accountTypeOptions: { id: AccountType; name: string; subtitle?: string }[] = [
  { id: 'cash', name: 'Cash' },
  { id: 'bank', name: 'Bank' },
  { id: 'ewallet', name: 'E-wallet' },
  { id: 'credit', name: 'Credit card' },
];

function SelectionModal({ visible, onClose, title, options, onSelect, selectedId }: SelectionModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose}>
        <View className="flex-1 justify-end">
          <Pressable className="bg-app-card dark:bg-app-card-dark rounded-t-[32px] overflow-hidden h-[70%]">
            <View className="items-center pt-4 pb-2">
              <View className="w-12 h-1.5 rounded-full bg-app-border dark:bg-app-border-dark" />
            </View>
            <View className="px-6 py-4 border-b border-app-border/50 dark:border-app-border-dark/50 flex-row justify-between items-center">
              <Text className="text-xl font-display text-app-text dark:text-app-text-dark">
                {title}
              </Text>
              <Pressable onPress={onClose} className="p-2 -mr-2">
                <Feather name="x" size={24} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              {options.map((option) => (
                <PressableScale
                  key={option.id}
                  className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl border ${
                    selectedId === option.id
                      ? 'bg-app-soft dark:bg-app-soft-dark border-app-brand dark:border-app-brand-dark'
                      : 'bg-transparent border-app-border dark:border-app-border-dark'
                  }`}
                  onPress={() => {
                    onSelect(option.id);
                    onClose();
                  }}
                >
                  <View>
                    <Text
                      className={`text-base font-medium ${
                        selectedId === option.id
                          ? 'text-app-brand dark:text-app-brand-dark'
                          : 'text-app-text dark:text-app-text-dark'
                      }`}
                    >
                      {option.name}
                    </Text>
                    {option.subtitle ? (
                      <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-0.5">
                        {option.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  {selectedId === option.id ? (
                    <Feather name="check" size={20} color={isDark ? '#58D5D8' : '#0A9396'} />
                  ) : null}
                </PressableScale>
              ))}
            </ScrollView>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function AddEditAccountScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { baseCurrency } = useSettingsStore();
  const route = useRoute();
  const params = route.params as { id?: string } | undefined;
  const editingId = params?.id;

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [currency, setCurrency] = useState('USD');
  const [startingBalance, setStartingBalance] = useState('');
  const [currentBalanceMinor, setCurrentBalanceMinor] = useState(0);
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  useEffect(() => {
    listCurrencies().then((items) => {
      setCurrencies(items);
    });
  }, []);

  useEffect(() => {
    if (!editingId && baseCurrency) {
      setCurrency(baseCurrency);
    }
  }, [editingId, baseCurrency]);

  useEffect(() => {
    if (!editingId) {
      setCurrentBalanceMinor(0);
      return;
    }
    getAccount(editingId).then((account) => {
      if (!account) return;
      setName(account.name);
      setType(account.type);
      setCurrency(account.currency);
      setStartingBalance(formatMinorInput(account.starting_balance_minor));
    });
    getAccountBalance(editingId).then((balance) => {
      setCurrentBalanceMinor(balance);
    });
  }, [editingId]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const resolvedCurrency = currency.trim() || baseCurrency || 'USD';
    if (editingId) {
      await updateAccount(editingId, {
        name: trimmedName || name,
        type: type as AccountType,
        currency: resolvedCurrency,
        starting_balance_minor: toMinor(startingBalance),
      });
      navigation.goBack();
      return;
    }

    await createAccount({
      name: trimmedName || name,
      type: type as AccountType,
      currency: resolvedCurrency,
      starting_balance_minor: toMinor(startingBalance),
    });
    navigation.goBack();
  };

  const selectedType = accountTypeOptions.find((option) => option.id === type);
  const heroBalanceMinor = editingId ? currentBalanceMinor : toMinor(startingBalance || '0');
  const heroSubtitle = name.trim() || 'Give your account a name';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="pt-8 pb-8 px-6 items-center">
          <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
            Account balance
          </Text>
          <Text className="text-5xl font-display text-app-text dark:text-app-text-dark mt-3 text-center leading-tight">
            {formatSigned(heroBalanceMinor, currency || baseCurrency || 'USD')}
          </Text>
          <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-3 text-center">
            {heroSubtitle}
          </Text>
        </View>

        {/* Details Card */}
        <View className="px-4">
          <View className="bg-app-card dark:bg-app-card-dark rounded-3xl overflow-hidden border border-app-border/50 dark:border-app-border-dark/50">
            <View className="flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                  <Feather name="edit-2" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                </View>
                <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Name</Text>
              </View>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Cash"
                placeholderTextColor={isDark ? '#8B949E' : '#6B7A8F'}
                className="text-base text-app-text dark:text-app-text-dark text-right min-w-[120px]"
              />
            </View>

            <PressableScale onPress={() => setShowTypeModal(true)} haptic>
              <View className="flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30">
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                    <Feather name="grid" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                  </View>
                  <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Type</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-app-muted dark:text-app-muted-dark">
                    {selectedType?.name ?? 'Select'}
                  </Text>
                  <Feather name="chevron-right" size={16} color={isDark ? '#8B949E' : '#6B7A8F'} />
                </View>
              </View>
            </PressableScale>

            <PressableScale onPress={() => setShowCurrencyModal(true)} haptic>
              <View className="flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30">
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                    <Feather name="dollar-sign" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                  </View>
                  <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Currency</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-app-muted dark:text-app-muted-dark">
                    {currency || baseCurrency}
                  </Text>
                  <Feather name="chevron-right" size={16} color={isDark ? '#8B949E' : '#6B7A8F'} />
                </View>
              </View>
            </PressableScale>

            <View className="flex-row items-center justify-between p-5">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                  <Feather name="trending-up" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                </View>
                <Text className="text-base font-medium text-app-text dark:text-app-text-dark">
                  Starting balance
                </Text>
              </View>
              <TextInput
                value={startingBalance}
                onChangeText={(value) => setStartingBalance(formatAmountInput(value))}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#8B949E' : '#6B7A8F'}
                keyboardType="decimal-pad"
                className="text-base text-app-text dark:text-app-text-dark text-right min-w-[100px]"
              />
            </View>
          </View>
        </View>

        <View className="px-6 mt-8">
          <Button
            title={editingId ? 'Update account' : 'Save account'}
            onPress={handleSave}
            variant="primary"
            icon={<Feather name="check" size={20} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>

      <SelectionModal
        visible={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        title="Account type"
        options={accountTypeOptions}
        onSelect={(id) => setType(id as AccountType)}
        selectedId={type}
      />

      <SelectionModal
        visible={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        title="Currency"
        options={currencies.map((currencyOption) => ({
          id: currencyOption.code,
          name: `${currencyOption.code} · ${currencyOption.name}`,
        }))}
        onSelect={setCurrency}
        selectedId={currency || baseCurrency}
      />
    </KeyboardAvoidingView>
  );
}
