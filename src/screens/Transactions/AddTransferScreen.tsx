import React, { useEffect, useRef, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { PressableScale } from '../../components/PressableScale';
import { listAccounts } from '../../db/repositories/accounts';
import { createTransfer } from '../../db/repositories/transfers';
import { toMinor } from '../../utils/money';

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

export default function AddTransferScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [accounts, setAccounts] = useState<{ id: string; name: string; currency: string }[]>([]);
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; from?: string; to?: string }>({});
  const scrollRef = useRef<ScrollView | null>(null);
  const heroOffset = useRef(0);

  useEffect(() => {
    listAccounts().then((accts) => {
      setAccounts(accts.map((acct) => ({ id: acct.id, name: acct.name, currency: acct.currency })));
      if (!fromAccountId && accts.length > 0) setFromAccountId(accts[0].id);
      if (!toAccountId && accts.length > 1) setToAccountId(accts[1].id);
    });
  }, [fromAccountId, toAccountId]);

  const handleSave = async () => {
    const amountMinor = toMinor(amount);
    const nextErrors: { amount?: string; from?: string; to?: string } = {};

    if (!fromAccountId) nextErrors.from = 'Required';
    if (!toAccountId) nextErrors.to = 'Required';
    if (fromAccountId && toAccountId && fromAccountId === toAccountId) {
      nextErrors.to = 'Choose a different account';
    }
    if (!amount || amountMinor <= 0) nextErrors.amount = 'Required';

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

    await createTransfer({
      from_account_id: fromAccountId!,
      to_account_id: toAccountId!,
      amount_minor: amountMinor,
      date_ts: finalDateTs,
      notes,
    });
    navigation.goBack();
  };

  const resolveDateFromInput = (input: string) => {
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const fromAccount = accounts.find((acct) => acct.id === fromAccountId);
  const toAccount = accounts.find((acct) => acct.id === toAccountId);
  const currencySymbol = fromAccount?.currency === 'EUR' ? '€' : '$';

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
            <Text className="text-4xl font-display text-app-muted dark:text-app-muted-dark mr-2">
              {currencySymbol}
            </Text>
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
          <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-2">
            Move money between accounts
          </Text>
        </View>

        {/* Details Card */}
        <View className="px-4">
          <View className="bg-app-card dark:bg-app-card-dark rounded-3xl overflow-hidden border border-app-border/50 dark:border-app-border-dark/50">
            <PressableScale onPress={() => setShowFromModal(true)} haptic>
              <View
                className={`flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30 ${
                  errors.from ? 'bg-app-danger/5' : ''
                }`}
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                    <Feather name="arrow-up-right" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                  </View>
                  <Text className="text-base font-medium text-app-text dark:text-app-text-dark">
                    From account
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-app-muted dark:text-app-muted-dark">
                    {fromAccount ? `${fromAccount.name} (${fromAccount.currency})` : 'Select'}
                  </Text>
                  <Feather name="chevron-right" size={16} color={isDark ? '#8B949E' : '#6B7A8F'} />
                </View>
              </View>
            </PressableScale>

            <PressableScale onPress={() => setShowToModal(true)} haptic>
              <View
                className={`flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30 ${
                  errors.to ? 'bg-app-danger/5' : ''
                }`}
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                    <Feather name="arrow-down-left" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                  </View>
                  <Text className="text-base font-medium text-app-text dark:text-app-text-dark">
                    To account
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-app-muted dark:text-app-muted-dark">
                    {toAccount ? `${toAccount.name} (${toAccount.currency})` : 'Select'}
                  </Text>
                  <Feather name="chevron-right" size={16} color={isDark ? '#8B949E' : '#6B7A8F'} />
                </View>
              </View>
            </PressableScale>

            <PressableScale
              onPress={() => {
                setPendingDate(resolveDateFromInput(dateInput));
                setShowDatePicker(true);
              }}
            >
              <View className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                    <Feather name="calendar" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                  </View>
                  <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Date</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-app-muted dark:text-app-muted-dark">
                    {dateInput}
                  </Text>
                  <Feather name="chevron-right" size={16} color={isDark ? '#8B949E' : '#6B7A8F'} />
                </View>
              </View>
            </PressableScale>
          </View>
          {errors.from ? (
            <Text className="text-xs text-app-danger dark:text-app-danger-dark mt-2 ml-2">
              Select a from account
            </Text>
          ) : null}
          {errors.to ? (
            <Text className="text-xs text-app-danger dark:text-app-danger-dark mt-2 ml-2">
              {errors.to === 'Choose a different account'
                ? 'Choose a different account'
                : 'Select a to account'}
            </Text>
          ) : null}
        </View>

        {/* Notes */}
        <View className="px-4 mt-6">
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
        </View>

        <View className="px-6 mt-8">
          <Button
            title="Save transfer"
            onPress={handleSave}
            variant="primary"
            icon={<Feather name="check" size={20} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>

      {showDatePicker && Platform.OS === 'android' ? (
        <DateTimePicker
          value={resolveDateFromInput(dateInput)}
          mode="date"
          display="calendar"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (event.type === 'dismissed') return;
            const nextDate = selectedDate ?? resolveDateFromInput(dateInput);
            setDateInput(nextDate.toISOString().slice(0, 10));
          }}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowDatePicker(false);
            setPendingDate(null);
          }}
        >
          <Pressable
            className="flex-1 bg-black/40 justify-end"
            onPress={() => {
              setShowDatePicker(false);
              setPendingDate(null);
            }}
          >
            <Pressable className="bg-app-card dark:bg-app-card-dark rounded-t-[32px] p-6" onPress={() => {}}>
              <Text className="text-lg font-display text-app-text dark:text-app-text-dark mb-4">
                Select date
              </Text>
              <View className="items-center">
                <DateTimePicker
                  value={pendingDate ?? resolveDateFromInput(dateInput)}
                  mode="date"
                  display="spinner"
                  style={{ alignSelf: 'center' }}
                  onChange={(_, selectedDate) => {
                    if (selectedDate) {
                      setPendingDate(selectedDate);
                    }
                  }}
                />
              </View>
              <View className="flex-row justify-end gap-3 mt-4">
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => {
                    setShowDatePicker(false);
                    setPendingDate(null);
                  }}
                />
                <Button
                  title="Done"
                  onPress={() => {
                    const nextDate = pendingDate ?? resolveDateFromInput(dateInput);
                    setDateInput(nextDate.toISOString().slice(0, 10));
                    setShowDatePicker(false);
                    setPendingDate(null);
                  }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      <SelectionModal
        visible={showFromModal}
        onClose={() => setShowFromModal(false)}
        title="From account"
        options={accounts.map((acct) => ({
          id: acct.id,
          name: acct.name,
          subtitle: acct.currency,
        }))}
        onSelect={(id) => {
          setFromAccountId(id);
          if (errors.from) {
            setErrors((prev) => ({ ...prev, from: undefined }));
          }
        }}
        selectedId={fromAccountId}
      />

      <SelectionModal
        visible={showToModal}
        onClose={() => setShowToModal(false)}
        title="To account"
        options={accounts.map((acct) => ({
          id: acct.id,
          name: acct.name,
          subtitle: acct.currency,
        }))}
        onSelect={(id) => {
          setToAccountId(id);
          if (errors.to) {
            setErrors((prev) => ({ ...prev, to: undefined }));
          }
        }}
        selectedId={toAccountId}
      />
    </KeyboardAvoidingView>
  );
}
