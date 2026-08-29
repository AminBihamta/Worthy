import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { KeyboardFormView } from '../../components/KeyboardFormView';
import { SelectField } from '../../components/SelectField';
import { getAccountTypeDefinition } from '../../data/accountTypes';
import { getCurrencyCountry } from '../../data/currencies';
import { createAccount, type AccountType } from '../../db/repositories/accounts';
import { CurrencyRow, listCurrencies } from '../../db/repositories/currencies';
import { formatAmountInput, formatSigned, toMinor } from '../../utils/money';

interface RouteParams {
  type: AccountType;
  defaultName: string;
  currency: string;
}

export default function OnboardingAccountForm({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { type, defaultName, currency: baseCurrency } = route.params as RouteParams;
  const definition = getAccountTypeDefinition(type);

  const [name, setName] = useState(defaultName);
  const [balance, setBalance] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(baseCurrency);
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    listCurrencies().then((items) => {
      if (active) setCurrencies(items);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!currencies.length) return;
    if (!currencies.some((item) => item.code === selectedCurrency)) {
      setSelectedCurrency(currencies[0].code);
    }
  }, [currencies, selectedCurrency]);

  const currencyOptions = useMemo(() => {
    if (currencies.length === 0) {
      if (!baseCurrency) return [];
      const country = getCurrencyCountry(baseCurrency);
      return [{ label: `${country.flag}  ${baseCurrency}`, value: baseCurrency }];
    }
    return currencies.map((currency) => {
      const country = getCurrencyCountry(currency.code);
      return {
        label: `${country.flag}  ${currency.code} · ${currency.name}`,
        value: currency.code,
        subtitle: country.name,
      };
    });
  }, [baseCurrency, currencies]);

  const selectedCountry = getCurrencyCountry(selectedCurrency || baseCurrency);
  const previewBalance = formatSigned(toMinor(balance), selectedCurrency || baseCurrency || 'USD');
  const canSave = Boolean(name.trim() && selectedCurrency && !saving);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Give this account a name to continue.');
      return;
    }
    if (!selectedCurrency) {
      setError('Choose a currency for this account.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createAccount({
        name: trimmedName,
        type,
        currency: selectedCurrency,
        starting_balance_minor: toMinor(balance),
      });
      navigation.goBack();
    } catch {
      setError('We could not save this account. Please try again.');
      setSaving(false);
    }
  };

  return (
    <KeyboardFormView className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="items-center mb-5">
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: `${definition.accent}1F` }}
          >
            <Feather name={definition.icon} size={22} color={definition.accent} />
          </View>
          <Text className="text-2xl font-display text-app-text dark:text-app-text-dark text-center">
            Add {definition.label}
          </Text>
          <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-1.5 text-center">
            Name it, choose its currency, and enter today’s balance.
          </Text>
        </View>

        <View className="rounded-[28px] bg-app-text dark:bg-app-card-dark p-4 mb-4 overflow-hidden">
          <View
            className="absolute -top-12 -right-10 w-36 h-36 rounded-full"
            style={{ backgroundColor: definition.accent, opacity: 0.22 }}
          />
          <View className="flex-row items-center justify-between">
            <Text className="text-xs uppercase tracking-widest text-white/60">Opening balance</Text>
            <View className="flex-row items-center rounded-full bg-white/10 px-3 py-1.5">
              <Text className="text-base mr-1.5">{selectedCountry.flag}</Text>
              <Text className="text-xs font-emphasis text-white">{selectedCurrency}</Text>
            </View>
          </View>
          <Text className="text-3xl font-display text-white mt-4" numberOfLines={1}>
            {previewBalance}
          </Text>
          <Text className="text-xs text-white/60 mt-2">
            You can start at zero and update it later.
          </Text>
        </View>

        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-3 px-1">
          Account details
        </Text>
        <View className="rounded-3xl border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark overflow-hidden mb-5">
          <View className="p-5 border-b border-app-border/50 dark:border-app-border-dark/50">
            <View className="flex-row items-center mb-3">
              <View className="w-9 h-9 rounded-xl bg-app-soft dark:bg-app-soft-dark items-center justify-center mr-3">
                <Feather name="edit-2" size={16} color={isDark ? '#EAEAEA' : '#0D1B2A'} />
              </View>
              <Text className="text-sm font-emphasis text-app-text dark:text-app-text-dark">
                Account name
              </Text>
            </View>
            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (error) setError(null);
              }}
              placeholder="e.g. Everyday wallet"
              placeholderTextColor={isDark ? '#A0A0A0' : '#6B7A8F'}
              autoCapitalize="words"
              returnKeyType="next"
              className="rounded-2xl bg-app-soft dark:bg-app-soft-dark px-4 py-3.5 text-base text-app-text dark:text-app-text-dark"
            />
          </View>

          <View className="p-5 border-b border-app-border/50 dark:border-app-border-dark/50">
            <SelectField
              label="Currency"
              value={selectedCurrency}
              options={currencyOptions}
              onChange={(value) => {
                setSelectedCurrency(value);
                if (error) setError(null);
              }}
              placeholder={currencyOptions.length === 0 ? 'No currencies available' : undefined}
            />
          </View>

          <View className="p-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-app-soft dark:bg-app-soft-dark items-center justify-center mr-3">
                  <Feather name="trending-up" size={16} color={isDark ? '#EAEAEA' : '#0D1B2A'} />
                </View>
                <Text className="text-sm font-emphasis text-app-text dark:text-app-text-dark">
                  Current balance
                </Text>
              </View>
              <Text className="text-xs font-emphasis text-app-muted dark:text-app-muted-dark">
                {selectedCurrency}
              </Text>
            </View>
            <TextInput
              value={balance}
              onChangeText={(value) => setBalance(formatAmountInput(value))}
              placeholder="0.00"
              placeholderTextColor={isDark ? '#A0A0A0' : '#6B7A8F'}
              keyboardType="number-pad"
              inputMode="decimal"
              className="rounded-2xl bg-app-soft dark:bg-app-soft-dark px-4 py-3.5 text-2xl font-display text-app-text dark:text-app-text-dark"
            />
          </View>
        </View>

        {error ? (
          <View className="flex-row items-center rounded-2xl bg-app-danger/10 px-4 py-3">
            <Feather name="alert-circle" size={16} color="#FF4500" />
            <Text className="text-sm text-app-danger dark:text-app-danger-dark ml-2 flex-1">
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={{ paddingBottom: insets.bottom + 16 }}
        className="absolute bottom-0 left-0 right-0 border-t border-app-border dark:border-app-border-dark bg-app-surface dark:bg-app-surface-dark px-5 pt-4"
      >
        <Button
          title={saving ? 'Saving account…' : 'Add account'}
          onPress={handleSave}
          variant="primary"
          disabled={!canSave}
          icon={<Feather name="plus" size={18} color="#FFFFFF" />}
        />
      </View>
    </KeyboardFormView>
  );
}
