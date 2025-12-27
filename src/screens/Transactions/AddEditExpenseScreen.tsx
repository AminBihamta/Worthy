import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
import Slider from '@react-native-community/slider';
import { addDays, addMonths, addWeeks, addYears } from 'date-fns';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Button } from '../../components/Button';
import { PressableScale } from '../../components/PressableScale';
import { getAccountBalance, listAccounts } from '../../db/repositories/accounts';
import { listCategories } from '../../db/repositories/categories';
import { listCurrencies, CurrencyRow } from '../../db/repositories/currencies';
import { createExpense, getExpense, updateExpense } from '../../db/repositories/expenses';
import { updateReceiptInbox } from '../../db/repositories/receipts';
import { createRecurringRule } from '../../db/repositories/recurring';
import { formatSigned, toMinor } from '../../utils/money';
import { buildRateMap, convertMinorBetween } from '../../utils/currency';
import { useSettingsStore } from '../../state/useSettingsStore';

type RecurringFrequency = 'off' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

const regretOptions = [
  { value: 0, label: 'Total regret', icon: 'frown' },
  { value: 25, label: 'Mostly regret', icon: 'meh' },
  { value: 50, label: 'Mixed feelings', icon: 'minus' },
  { value: 75, label: 'Worth it', icon: 'smile' },
  { value: 100, label: 'Absolutely worth it', icon: 'heart' },
];

const recurringOptions: { id: RecurringFrequency; name: string; subtitle?: string }[] = [
  { id: 'off', name: 'Off', subtitle: 'No recurrence' },
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'biweekly', name: 'Bi-weekly' },
  { id: 'monthly', name: 'Monthly' },
  { id: 'yearly', name: 'Yearly' },
];

const getRecurringConfig = (frequency: RecurringFrequency, baseDate: number) => {
  const base = new Date(baseDate);
  switch (frequency) {
    case 'daily':
      return { rrule_text: 'FREQ=DAILY;INTERVAL=1', next_run_ts: addDays(base, 1).getTime() };
    case 'weekly':
      return { rrule_text: 'FREQ=WEEKLY;INTERVAL=1', next_run_ts: addWeeks(base, 1).getTime() };
    case 'biweekly':
      return { rrule_text: 'FREQ=WEEKLY;INTERVAL=2', next_run_ts: addWeeks(base, 2).getTime() };
    case 'monthly':
      return { rrule_text: 'FREQ=MONTHLY;INTERVAL=1', next_run_ts: addMonths(base, 1).getTime() };
    case 'yearly':
      return { rrule_text: 'FREQ=YEARLY;INTERVAL=1', next_run_ts: addYears(base, 1).getTime() };
    default:
      return null;
  }
};

const normalizeRegretValue = (value: number) => {
  const snapped = Math.round(value / 25) * 25;
  return Math.max(0, Math.min(100, snapped));
};

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { id: string; name: string; subtitle?: string }[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

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
                    <Text className={`text-base font-medium ${
                      selectedId === option.id ? 'text-app-brand dark:text-app-brand-dark' : 'text-app-text dark:text-app-text-dark'
                    }`}>
                      {option.name}
                    </Text>
                    {option.subtitle && (
                      <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-0.5">
                        {option.subtitle}
                      </Text>
                    )}
                  </View>
                  {selectedId === option.id && (
                    <Feather name="check" size={20} color={isDark ? '#58D5D8' : '#0A9396'} />
                  )}
                </PressableScale>
              ))}
            </ScrollView>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function AddEditExpenseScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { baseCurrency } = useSettingsStore();
  const route = useRoute();
  const params = route.params as { id?: string; receiptId?: string } | undefined;
  const editingId = params?.id;
  const receiptId = params?.receiptId;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string>('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [sliderValue, setSliderValue] = useState(50);
  const [notes, setNotes] = useState('');
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('off');
  const [errors, setErrors] = useState<{ amount?: string; title?: string }>({});
  const [originalExpense, setOriginalExpense] = useState<{
    amount_minor: number;
    account_id: string;
    currency_code: string | null;
    account_currency: string;
  } | null>(null);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string; currency: string }[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const heroOffset = useRef(0);

  useEffect(() => {
    Promise.all([listCategories(), listAccounts(), listCurrencies()]).then(
      ([cats, accts, currencyRows]) => {
        setCategories(cats.map((cat) => ({ id: cat.id, name: cat.name })));
        setAccounts(accts.map((acct) => ({ id: acct.id, name: acct.name, currency: acct.currency })));
        setCurrencies(currencyRows);
        if (!categoryId && cats.length > 0) setCategoryId(cats[0].id);
      },
    );
  }, []);

  useEffect(() => {
    if (!currencyCode && baseCurrency) {
      setCurrencyCode(baseCurrency);
    }
  }, [baseCurrency, currencyCode]);

  useEffect(() => {
    if (editingId) return;
    if (!accountId && accounts.length > 0) {
      const preferred =
        accounts.find((acct) => acct.currency === (currencyCode || baseCurrency)) ?? accounts[0];
      setAccountId(preferred.id);
      if (!currencyCode) {
        setCurrencyCode(preferred.currency);
      }
    }
  }, [accounts, accountId, currencyCode, baseCurrency, editingId]);

  useEffect(() => {
    if (!editingId) return;
    getExpense(editingId).then((expense) => {
      if (!expense) return;
      setOriginalExpense({
        amount_minor: expense.amount_minor,
        account_id: expense.account_id,
        currency_code: expense.currency_code ?? null,
        account_currency: expense.account_currency,
      });
      setTitle(expense.title);
      setAmount(String(expense.amount_minor / 100));
      setCategoryId(expense.category_id);
      setAccountId(expense.account_id);
      setCurrencyCode(expense.currency_code ?? expense.account_currency ?? baseCurrency);
      setDateInput(new Date(expense.date_ts).toISOString().slice(0, 10));
      setSliderValue(normalizeRegretValue(expense.slider_0_100));
      setNotes(expense.notes ?? '');
    });
  }, [editingId, baseCurrency]);

  const handleSave = async () => {
    if (!categoryId || !accountId) return;
    const trimmedTitle = title.trim();
    const amountMinor = toMinor(amount);
    const nextErrors: { amount?: string; title?: string } = {};
    if (!trimmedTitle) {
      nextErrors.title = 'Required';
    }
    if (!amount || amountMinor <= 0) {
      nextErrors.amount = 'Required';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, heroOffset.current - 24),
          animated: true,
        });
      });
      return;
    }
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
    const parsedDate = new Date(dateInput);
    const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const finalDateTs = safeDate.setHours(12, 0, 0, 0);
    const selectedAccount = accounts.find((acct) => acct.id === accountId);
    const effectiveCurrencyCode = currencyCode || selectedAccount?.currency || baseCurrency;
    const rateMap = buildRateMap(currencies, baseCurrency);
    const amountInAccountMinor = convertMinorBetween(
      amountMinor,
      effectiveCurrencyCode,
      selectedAccount?.currency,
      rateMap,
      baseCurrency,
    );

    const warnInsufficient = async (availableMinor: number) => {
      const currency = selectedAccount?.currency ?? 'USD';
      Alert.alert(
        'Not enough balance',
        `You only have ${formatSigned(availableMinor, currency)} available in ${
          selectedAccount?.name ?? 'this account'
        }. Transfer funds to continue.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Transfer',
            onPress: () => navigation.navigate('AddTransfer' as never),
          },
        ],
      );
    };

    if (editingId) {
      const currentBalance = await getAccountBalance(accountId);
      const originalAmountInAccountMinor =
        originalExpense && originalExpense.account_id === accountId
          ? convertMinorBetween(
              originalExpense.amount_minor,
              originalExpense.currency_code ?? originalExpense.account_currency,
              selectedAccount?.currency ?? originalExpense.account_currency,
              rateMap,
              baseCurrency,
            )
          : 0;
      const availableBalance =
        originalExpense && originalExpense.account_id === accountId
          ? currentBalance + originalAmountInAccountMinor
          : currentBalance;

      if (amountInAccountMinor > availableBalance) {
        await warnInsufficient(availableBalance);
        return;
      }

      await updateExpense(editingId, {
        title: trimmedTitle,
        amount_minor: amountMinor,
        category_id: categoryId,
        account_id: accountId,
        currency_code: effectiveCurrencyCode,
        date_ts: finalDateTs,
        slider_0_100: sliderValue,
        notes,
      });
      navigation.goBack();
      return;
    }

    const currentBalance = await getAccountBalance(accountId);
    if (amountInAccountMinor > currentBalance) {
      await warnInsufficient(currentBalance);
      return;
    }

    const id = await createExpense({
      title: trimmedTitle,
      amount_minor: amountMinor,
      category_id: categoryId,
      account_id: accountId,
      currency_code: effectiveCurrencyCode,
      date_ts: finalDateTs,
      slider_0_100: sliderValue,
      notes,
    });

    if (receiptId) {
      await updateReceiptInbox(receiptId, { status: 'processed', linked_expense_id: id });
    }

    if (recurringFrequency !== 'off') {
      const config = getRecurringConfig(recurringFrequency, finalDateTs);
      if (config) {
        await createRecurringRule({
          entity_type: 'expense',
          entity_id: id,
          rrule_text: config.rrule_text,
          next_run_ts: config.next_run_ts,
        });
      }
    }

    navigation.goBack();
  };

  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedAccount = accounts.find(a => a.id === accountId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View
          className="pt-8 pb-8 px-6 items-center justify-center"
          onLayout={(event) => {
            heroOffset.current = event.nativeEvent.layout.y;
          }}
        >
          <View className="flex-row items-center justify-center w-full px-2">
            <Text className="text-4xl font-display text-app-muted dark:text-app-muted-dark mr-2">$</Text>
            <View
              style={{ maxWidth: '78%', minWidth: 0, flexShrink: 1 }}
              className={errors.amount ? 'border-b-2 border-app-danger dark:border-app-danger-dark pb-1' : ''}
            >
              <TextInput
                value={amount}
                onChangeText={(value) => {
                  setAmount(value);
                  if (errors.amount) {
                    setErrors((prev) => ({ ...prev, amount: undefined }));
                  }
                }}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#30363D' : '#D1DDE6'}
                keyboardType="decimal-pad"
                className="text-6xl font-display text-app-text dark:text-app-text-dark text-center w-full"
                autoFocus={!editingId}
                adjustsFontSizeToFit
                numberOfLines={1}
              />
            </View>
          </View>
          {errors.amount ? (
            <Text className="text-xs text-app-danger dark:text-app-danger-dark mt-2">
              Enter an amount
            </Text>
          ) : null}
          <View
            className={`w-full ${
              errors.title
                ? 'mt-4 px-4 py-3 rounded-2xl border border-app-danger/40 dark:border-app-danger-dark/40 bg-app-danger/5'
                : 'mt-2'
            }`}
          >
            <TextInput
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                if (errors.title) {
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
              placeholder="What is this for?"
              placeholderTextColor={isDark ? '#8B949E' : '#6B7A8F'}
              className="text-xl text-app-text dark:text-app-text-dark text-center font-medium w-full"
            />
          </View>
          {errors.title ? (
            <Text className="text-xs text-app-danger dark:text-app-danger-dark mt-2">
              Add a short title
            </Text>
          ) : null}
        </View>

        {/* Details Card */}
        <View className="px-4">
          <View className="bg-app-card dark:bg-app-card-dark rounded-3xl overflow-hidden border border-app-border/50 dark:border-app-border-dark/50">
            {/* Category Row */}
            <PressableScale onPress={() => setShowCategoryModal(true)}>
              <View className="flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30">
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                    <Feather name="tag" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                  </View>
                  <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Category</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-app-muted dark:text-app-muted-dark">
                    {selectedCategory?.name || 'Select'}
                  </Text>
                  <Feather name="chevron-right" size={16} color={isDark ? '#8B949E' : '#6B7A8F'} />
                </View>
              </View>
            </PressableScale>

            {/* Account Row */}
            <PressableScale onPress={() => setShowAccountModal(true)}>
              <View className="flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30">
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                    <Feather name="credit-card" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                  </View>
                  <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Account</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-app-muted dark:text-app-muted-dark">
                    {selectedAccount?.name || 'Select'}
                  </Text>
                  <Feather name="chevron-right" size={16} color={isDark ? '#8B949E' : '#6B7A8F'} />
                </View>
              </View>
            </PressableScale>

            {/* Currency Row */}
            <PressableScale onPress={() => setShowCurrencyModal(true)}>
              <View className="flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30">
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                    <Feather name="dollar-sign" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                  </View>
                  <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Currency</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-app-muted dark:text-app-muted-dark">
                    {currencyCode || baseCurrency}
                  </Text>
                  <Feather name="chevron-right" size={16} color={isDark ? '#8B949E' : '#6B7A8F'} />
                </View>
              </View>
            </PressableScale>

            {/* Date Row */}
            <View className="flex-row items-center justify-between p-5">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                  <Feather name="calendar" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                </View>
                <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Date</Text>
              </View>
              <TextInput
                value={dateInput}
                onChangeText={setDateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={isDark ? '#8B949E' : '#6B7A8F'}
                className="text-base text-app-muted dark:text-app-muted-dark text-right min-w-[100px]"
              />
            </View>
          </View>
        </View>

        {/* Slider Section */}
        <View className="px-6 mt-8">
          <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-4 ml-2">
            How do you feel?
          </Text>
          <View className="bg-app-card dark:bg-app-card-dark rounded-3xl p-6 border border-app-border/50 dark:border-app-border-dark/50">
            {(() => {
              const selected = regretOptions.find((option) => option.value === sliderValue) ?? regretOptions[2];
              return (
                <View className="items-center mb-6">
                  <View className="w-12 h-12 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center mb-3">
                    <Feather name={selected.icon as any} size={24} color={isDark ? '#58D5D8' : '#0A9396'} />
                  </View>
                  <Text className="text-lg font-display text-app-text dark:text-app-text-dark">
                    {selected.label}
                  </Text>
                </View>
              );
            })()}
            
            <Slider
              value={sliderValue}
              minimumValue={0}
              maximumValue={100}
              step={25}
              minimumTrackTintColor={isDark ? '#58D5D8' : '#0A9396'}
              maximumTrackTintColor={isDark ? '#30363D' : '#D1DDE6'}
              thumbTintColor={isDark ? '#58D5D8' : '#0A9396'}
              onValueChange={(val) => {
                Haptics.selectionAsync();
                setSliderValue(val);
              }}
              style={{ height: 40 }}
            />
            <View className="flex-row justify-between px-2 mt-2">
              <Text className="text-[10px] text-app-muted dark:text-app-muted-dark">Regret</Text>
              <Text className="text-[10px] text-app-muted dark:text-app-muted-dark">Worth it</Text>
            </View>
          </View>
        </View>

        {/* Notes & Recurring */}
        <View className="px-4 mt-6 space-y-4">
          <View className="bg-app-card dark:bg-app-card-dark rounded-3xl p-5 border border-app-border/50 dark:border-app-border-dark/50">
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes..."
              placeholderTextColor={isDark ? '#8B949E' : '#6B7A8F'}
              multiline
              className="text-base text-app-text dark:text-app-text-dark min-h-[80px]"
              textAlignVertical="top"
            />
          </View>

          {!editingId && (
            <PressableScale
              onPress={() => {
                Haptics.selectionAsync();
                setShowRecurringModal(true);
              }}
              className="flex-row items-center justify-between p-5 rounded-3xl border bg-app-card dark:bg-app-card-dark border-app-border/50 dark:border-app-border-dark/50"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full items-center justify-center bg-app-soft dark:bg-app-soft-dark">
                  <Feather name="repeat" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                </View>
                <View>
                  <Text className="text-base font-medium text-app-text dark:text-app-text-dark">
                    Recurring
                  </Text>
                  <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                    {recurringOptions.find((option) => option.id === recurringFrequency)?.name ??
                      'Off'}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={isDark ? '#8B949E' : '#6B7A8F'} />
            </PressableScale>
          )}
        </View>

        <View className="px-6 mt-8">
          <Button
            title={editingId ? 'Update Expense' : 'Save Expense'}
            onPress={handleSave}
            variant="primary"
            icon={<Feather name="check" size={20} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>

      <SelectionModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Select Category"
        options={categories}
        onSelect={setCategoryId}
        selectedId={categoryId}
      />

      <SelectionModal
        visible={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title="Select Account"
        options={accounts.map(a => ({ ...a, subtitle: a.currency }))}
        onSelect={(id) => {
          setAccountId(id);
          const selected = accounts.find((acct) => acct.id === id);
          if (selected) {
            setCurrencyCode(selected.currency);
          }
        }}
        selectedId={accountId}
      />

      <SelectionModal
        visible={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        title="Currency"
        options={currencies.map((currency) => ({
          id: currency.code,
          name: `${currency.code} · ${currency.name}`,
        }))}
        onSelect={(id) => {
          setCurrencyCode(id);
          const match = accounts.find((acct) => acct.currency === id);
          if (match) {
            setAccountId(match.id);
          } else {
            setAccountId(null);
          }
        }}
        selectedId={currencyCode}
      />

      <SelectionModal
        visible={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        title="Recurring"
        options={recurringOptions}
        onSelect={(id) => setRecurringFrequency(id as RecurringFrequency)}
        selectedId={recurringFrequency}
      />
    </KeyboardAvoidingView>
  );
}
