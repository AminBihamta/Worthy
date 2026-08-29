import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PressableScale } from '../../components/PressableScale';
import { SwipeableRow } from '../../components/SwipeableRow';
import { useSettingsStore } from '../../state/useSettingsStore';
import {
  archiveCurrency,
  listCurrencies,
  upsertCurrency,
  CurrencyRow,
} from '../../db/repositories/currencies';
import {
  CURRENCY_CATALOG,
  getCurrencyCountry,
  getDefaultRateToBase,
  getCurrencyDefinition,
  getCurrencySymbol,
} from '../../data/currencies';

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: {
    id: string;
    name: string;
    subtitle?: string;
    flag?: string;
    trailing?: string;
  }[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

function SelectionModal({
  visible,
  onClose,
  title,
  options,
  onSelect,
  selectedId,
}: SelectionModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter(
      (option) =>
        option.name.toLowerCase().includes(normalized) ||
        option.subtitle?.toLowerCase().includes(normalized) ||
        option.trailing?.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Pressable className="flex-1 bg-black/60" onPress={onClose}>
          <View className="flex-1 justify-end">
            <Pressable
              className="bg-app-card dark:bg-app-card-dark rounded-t-[32px] overflow-hidden h-[78%]"
              onPress={(event) => event.stopPropagation()}
            >
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
              <View className="px-6 py-4">
                <View className="flex-row items-center gap-3 rounded-2xl border border-app-border dark:border-app-border-dark bg-app-bg dark:bg-app-bg-dark px-4">
                  <Feather name="search" size={18} color={isDark ? '#8B949E' : '#6B7A8F'} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search country or currency"
                    placeholderTextColor={isDark ? '#8B949E' : '#6B7A8F'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    className="flex-1 py-3 text-base text-app-text dark:text-app-text-dark"
                  />
                  {query ? (
                    <Pressable onPress={() => setQuery('')} className="p-1">
                      <Feather name="x-circle" size={18} color={isDark ? '#8B949E' : '#6B7A8F'} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
              <FlatList
                data={filteredOptions}
                keyExtractor={(option) => option.id}
                extraData={selectedId}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
                ListEmptyComponent={
                  <Text className="py-8 text-center text-sm text-app-muted dark:text-app-muted-dark">
                    No currencies found.
                  </Text>
                }
                renderItem={({ item: option }) => (
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
                    accessibilityRole="button"
                    accessibilityLabel={`${option.name}, ${option.trailing ?? option.id}, ${option.subtitle ?? ''}`}
                    accessibilityState={{ selected: selectedId === option.id }}
                  >
                    <View className="flex-row items-center flex-1 min-w-0 pr-4">
                      <Text className="text-2xl mr-3">{option.flag ?? '🌐'}</Text>
                      <Text
                        numberOfLines={1}
                        className={`text-base font-medium ${
                          selectedId === option.id
                            ? 'text-app-brand dark:text-app-brand-dark'
                            : 'text-app-text dark:text-app-text-dark'
                        }`}
                      >
                        {option.name}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <Text
                        className={`text-base font-display ${
                          selectedId === option.id
                            ? 'text-app-brand dark:text-app-brand-dark'
                            : 'text-app-text dark:text-app-text-dark'
                        }`}
                      >
                        {option.trailing ?? option.id}
                      </Text>
                      {selectedId === option.id ? (
                        <Feather name="check" size={20} color={isDark ? '#58D5D8' : '#0A9396'} />
                      ) : null}
                    </View>
                  </PressableScale>
                )}
              />
            </Pressable>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function WelcomeScreen({ navigation }: { navigation: any }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const { baseCurrency, setBaseCurrency } = useSettingsStore();
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);

  // Modal states
  const [showBaseModal, setShowBaseModal] = useState(false);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  // Form states
  const [editing, setEditing] = useState<CurrencyRow | null>(null);
  const [rate, setRate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const items = await listCurrencies();
    setCurrencies(items);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (!showFormModal) {
      setError(null);
    }
  }, [showFormModal]);

  const baseCurrencyRow = useMemo(
    () => currencies.find((currency) => currency.code === baseCurrency),
    [currencies, baseCurrency],
  );

  const baseCurrencyDefinition = getCurrencyDefinition(baseCurrency);
  const baseCurrencyCountry = getCurrencyCountry(baseCurrency);
  const favoriteCurrencies = useMemo(
    () => currencies.filter((currency) => currency.code !== baseCurrency),
    [baseCurrency, currencies],
  );
  const editingCountry = editing ? getCurrencyCountry(editing.code) : null;

  const baseOptions = useMemo(() => {
    const definitions = new Map(CURRENCY_CATALOG.map((currency) => [currency.code, currency]));
    currencies.forEach((currency) => {
      definitions.set(currency.code, { code: currency.code, name: currency.name });
    });

    return Array.from(definitions.values())
      .sort((left, right) => left.code.localeCompare(right.code))
      .map((currency) => {
        const symbol = getCurrencySymbol(currency.code);
        const isCatalogCurrency = Boolean(getCurrencyDefinition(currency.code));
        const country = isCatalogCurrency
          ? getCurrencyCountry(currency.code)
          : { flag: '🌐', name: 'Custom currency' };
        return {
          id: currency.code,
          name: country.name,
          flag: country.flag,
          trailing: currency.code,
          subtitle: symbol === currency.code ? currency.name : `${currency.name} · ${symbol}`,
        };
      });
  }, [currencies]);

  const favoriteOptions = useMemo(() => {
    const selectedCodes = new Set(currencies.map((currency) => currency.code));
    return CURRENCY_CATALOG.filter(
      (currency) => currency.code !== baseCurrency && !selectedCodes.has(currency.code),
    ).map((currency) => {
      const country = getCurrencyCountry(currency.code);
      const symbol = getCurrencySymbol(currency.code);
      return {
        id: currency.code,
        name: country.name,
        flag: country.flag,
        trailing: currency.code,
        subtitle: symbol === currency.code ? currency.name : `${currency.name} · ${symbol}`,
      };
    });
  }, [baseCurrency, currencies]);

  const openEdit = (currency: CurrencyRow) => {
    setEditing(currency);
    setRate(String(currency.rate_to_base));
    setShowFormModal(true);
  };

  const handleSave = async () => {
    const parsedRate = Number.parseFloat(rate);

    if (!editing || Number.isNaN(parsedRate) || parsedRate <= 0) {
      setError('Enter a valid conversion rate greater than zero.');
      return;
    }

    await upsertCurrency({
      code: editing.code,
      name: editing.name,
      symbol: editing.symbol,
      rate_to_base: editing.code === baseCurrency ? 1 : parsedRate,
    });

    setShowFormModal(false);
    setEditing(null);
    load();
  };

  const handleAddFavorite = async (codeValue: string) => {
    const definition = getCurrencyDefinition(codeValue);
    if (!definition) return;

    await upsertCurrency({
      code: definition.code,
      name: definition.name,
      symbol: getCurrencySymbol(definition.code),
      rate_to_base: getDefaultRateToBase(definition.code, baseCurrency),
    });
    Haptics.selectionAsync();
    await load();
  };

  const handleSetBase = async (codeValue: string) => {
    const normalized = codeValue.toUpperCase();
    const existing = currencies.find((currency) => currency.code === normalized);
    const definition = getCurrencyDefinition(normalized);
    const newBaseRate = existing?.rate_to_base ?? getDefaultRateToBase(normalized, baseCurrency);

    await Promise.all(
      currencies.map((currency) =>
        upsertCurrency({
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
          rate_to_base: currency.code === normalized ? 1 : currency.rate_to_base / newBaseRate,
        }),
      ),
    );
    await upsertCurrency({
      code: normalized,
      name: existing?.name ?? definition?.name ?? normalized,
      symbol: existing?.symbol ?? getCurrencySymbol(normalized),
      rate_to_base: 1,
    });
    await setBaseCurrency(normalized);
    Haptics.selectionAsync();
    load();
  };

  const handleNext = () => {
    if (!baseCurrency) {
      Alert.alert('Selection Required', 'Please select a base currency to continue.');
      return;
    }
    navigation.navigate('AccountsSetup');
  };

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8">
          <Text className="text-4xl font-display font-bold text-app-text dark:text-app-text-dark mb-4">
            Welcome to Worthy
          </Text>
          <Text className="text-base text-app-muted dark:text-app-muted-dark leading-6">
            Let's get you set up. First, choose your primary currency for tracking your wealth.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-4 pl-1">
            Base currency
          </Text>
          <Card>
            <PressableScale
              onPress={() => setShowBaseModal(true)}
              haptic
              accessibilityRole="button"
              accessibilityLabel={`${baseCurrencyCountry.name}, ${baseCurrency}, ${baseCurrencyRow?.name ?? baseCurrencyDefinition?.name ?? 'Base currency'}`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 min-w-0 mr-3">
                  <Text className="text-3xl mr-4">{baseCurrencyCountry.flag}</Text>
                  <View className="flex-1 min-w-0">
                    <Text className="text-xl font-display text-app-text dark:text-app-text-dark">
                      {baseCurrencyRow ? baseCurrencyRow.code : baseCurrency}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="text-sm text-app-muted dark:text-app-muted-dark mt-1"
                    >
                      {baseCurrencyCountry.name} ·{' '}
                      {baseCurrencyRow?.name ??
                        baseCurrencyDefinition?.name ??
                        'Default reporting currency'}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="px-3 py-1 rounded-full bg-app-soft dark:bg-app-soft-dark">
                    <Text className="text-xs text-app-text dark:text-app-text-dark">Selected</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={isDark ? '#8B949E' : '#6B7A8F'} />
                </View>
              </View>
            </PressableScale>
          </Card>
        </View>

        <View className="flex-row items-center justify-between mb-4 pl-1">
          <Text className="text-lg font-display text-app-text dark:text-app-text-dark">
            Favorite currencies
          </Text>
          <PressableScale onPress={() => setShowFavoriteModal(true)} haptic>
            <View className="flex-row items-center gap-2 px-3 py-2 rounded-full bg-app-soft dark:bg-app-soft-dark">
              <Feather name="plus" size={16} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
              <Text className="text-sm text-app-text dark:text-app-text-dark">Add</Text>
            </View>
          </PressableScale>
        </View>

        {favoriteCurrencies.length === 0 ? (
          <Card>
            <Text className="text-sm text-app-muted dark:text-app-muted-dark">
              Add currencies you use often. Each starts with a suggested rate that you can update
              anytime.
            </Text>
          </Card>
        ) : (
          favoriteCurrencies.map((currency) => {
            const country = getCurrencyCountry(currency.code);
            const rateLabel = `1 ${currency.code} = ${currency.rate_to_base.toFixed(4)} ${baseCurrency}`;
            return (
              <View key={currency.code} className="mb-4">
                <SwipeableRow
                  onEdit={() => openEdit(currency)}
                  onDelete={async () => {
                    await archiveCurrency(currency.code);
                    load();
                  }}
                >
                  <PressableScale onPress={() => openEdit(currency)} haptic>
                    <Card>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 min-w-0 gap-4">
                          <Text className="text-2xl">{country.flag}</Text>
                          <View className="flex-1 min-w-0">
                            <Text className="text-base font-display text-app-text dark:text-app-text-dark">
                              {currency.code}
                            </Text>
                            <Text
                              numberOfLines={1}
                              className="text-xs text-app-muted dark:text-app-muted-dark mt-1"
                            >
                              {currency.name}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end ml-3">
                          <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                            {rateLabel}
                          </Text>
                          <Text className="text-xs text-app-brand dark:text-app-brand-dark mt-1">
                            Tap to update
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </PressableScale>
                </SwipeableRow>
              </View>
            );
          })
        )}

        <View className="h-20" />
      </ScrollView>

      {/* Footer */}
      <View
        style={{ paddingBottom: insets.bottom + 20 }}
        className="absolute bottom-0 left-0 right-0 bg-app-bg dark:bg-app-bg-dark border-t border-app-border dark:border-app-border-dark px-6 pt-4"
      >
        <Button title="Continue" onPress={handleNext} variant="primary" />
      </View>

      <SelectionModal
        visible={showBaseModal}
        onClose={() => setShowBaseModal(false)}
        title="Base currency"
        options={baseOptions}
        onSelect={handleSetBase}
        selectedId={baseCurrency}
      />

      <SelectionModal
        visible={showFavoriteModal}
        onClose={() => setShowFavoriteModal(false)}
        title="Add favorite currency"
        options={favoriteOptions}
        onSelect={handleAddFavorite}
        selectedId={null}
      />

      <Modal
        visible={showFormModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFormModal(false)}
      >
        <Pressable className="flex-1 bg-black/60" onPress={() => setShowFormModal(false)}>
          <View className="flex-1 justify-end">
            <Pressable className="bg-app-card dark:bg-app-card-dark rounded-t-[32px] overflow-hidden">
              <View className="items-center pt-4 pb-2">
                <View className="w-12 h-1.5 rounded-full bg-app-border dark:bg-app-border-dark" />
              </View>
              <View className="px-6 py-4 border-b border-app-border/50 dark:border-app-border-dark/50 flex-row justify-between items-center">
                <Text className="text-xl font-display text-app-text dark:text-app-text-dark">
                  Update conversion rate
                </Text>
                <Pressable onPress={() => setShowFormModal(false)} className="p-2 -mr-2">
                  <Feather name="x" size={24} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
                {editing ? (
                  <View className="flex-row items-center mb-5">
                    <Text className="text-3xl mr-4">{editingCountry?.flag ?? '🌐'}</Text>
                    <View>
                      <Text className="text-lg font-display text-app-text dark:text-app-text-dark">
                        {editing.code} · {editing.name}
                      </Text>
                      <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-1">
                        Enter how much 1 {editing.code} is worth in {baseCurrency}.
                      </Text>
                    </View>
                  </View>
                ) : null}

                <View className="bg-app-card dark:bg-app-card-dark rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 overflow-hidden">
                  <View className="flex-row items-center justify-between p-5">
                    <View className="flex-row items-center flex-1 gap-4 mr-4">
                      <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                        <Feather name="repeat" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                      </View>
                      <Text className="text-base font-medium text-app-text dark:text-app-text-dark">
                        Rate to {baseCurrency}
                      </Text>
                    </View>
                    <TextInput
                      value={rate}
                      onChangeText={setRate}
                      placeholder="1.00"
                      placeholderTextColor={isDark ? '#8B949E' : '#6B7A8F'}
                      keyboardType="decimal-pad"
                      autoFocus
                      selectTextOnFocus
                      className="text-base text-app-text dark:text-app-text-dark text-right min-w-[110px]"
                    />
                  </View>
                </View>

                {error ? (
                  <Text className="text-xs text-app-danger dark:text-app-danger-dark mt-3">
                    {error}
                  </Text>
                ) : null}

                <View className="mt-6">
                  <Button
                    title="Update rate"
                    onPress={handleSave}
                    variant="primary"
                    icon={<Feather name="check" size={20} color="#FFFFFF" />}
                  />
                </View>
              </ScrollView>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
