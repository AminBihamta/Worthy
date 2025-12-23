import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { addMonths } from 'date-fns';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SelectField } from '../../components/SelectField';
import { listAccounts } from '../../db/repositories/accounts';
import { listCategories } from '../../db/repositories/categories';
import { createExpense, getExpense, updateExpense } from '../../db/repositories/expenses';
import { updateReceiptInbox } from '../../db/repositories/receipts';
import { createRecurringRule } from '../../db/repositories/recurring';
import { toMinor } from '../../utils/money';

export default function AddEditExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { id?: string; receiptId?: string } | undefined;
  const editingId = params?.id;
  const receiptId = params?.receiptId;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [sliderValue, setSliderValue] = useState(60);
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(false);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string; currency: string }[]>([]);

  useEffect(() => {
    Promise.all([listCategories(), listAccounts()]).then(([cats, accts]) => {
      setCategories(cats.map((cat) => ({ id: cat.id, name: cat.name })));
      setAccounts(accts.map((acct) => ({ id: acct.id, name: acct.name, currency: acct.currency })));
      if (!categoryId && cats.length > 0) setCategoryId(cats[0].id);
      if (!accountId && accts.length > 0) setAccountId(accts[0].id);
    });
  }, [accountId, categoryId]);

  useEffect(() => {
    if (!editingId) return;
    getExpense(editingId).then((expense) => {
      if (!expense) return;
      setTitle(expense.title);
      setAmount(String(expense.amount_minor / 100));
      setCategoryId(expense.category_id);
      setAccountId(expense.account_id);
      setDateInput(new Date(expense.date_ts).toISOString().slice(0, 10));
      setSliderValue(expense.slider_0_100);
      setNotes(expense.notes ?? '');
    });
  }, [editingId]);

  const handleSave = async () => {
    if (!categoryId || !accountId) return;
    const amountMinor = toMinor(amount);
    const parsedDate = new Date(dateInput);
    const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const finalDateTs = safeDate.setHours(12, 0, 0, 0);

    if (editingId) {
      await updateExpense(editingId, {
        title,
        amount_minor: amountMinor,
        category_id: categoryId,
        account_id: accountId,
        date_ts: finalDateTs,
        slider_0_100: sliderValue,
        notes,
      });
      navigation.goBack();
      return;
    }

    const id = await createExpense({
      title,
      amount_minor: amountMinor,
      category_id: categoryId,
      account_id: accountId,
      date_ts: finalDateTs,
      slider_0_100: sliderValue,
      notes,
    });

    if (receiptId) {
      await updateReceiptInbox(receiptId, { status: 'processed', linked_expense_id: id });
    }

    if (recurring) {
      await createRecurringRule({
        entity_type: 'expense',
        entity_id: id,
        rrule_text: 'FREQ=MONTHLY;INTERVAL=1',
        next_run_ts: addMonths(new Date(finalDateTs), 1).getTime(),
      });
    }

    navigation.goBack();
  };

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 20 }}
    >
      <Input
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Weekly groceries"
      />
      <Input
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
      <SelectField
        label="Category"
        value={categoryId}
        options={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
        onChange={setCategoryId}
      />
      <SelectField
        label="Account"
        value={accountId}
        options={accounts.map((acct) => ({
          label: `${acct.name} (${acct.currency})`,
          value: acct.id,
        }))}
        onChange={setAccountId}
      />

      <Input
        label="Date (YYYY-MM-DD)"
        value={dateInput}
        onChangeText={(value) => {
          setDateInput(value);
        }}
        placeholder="2025-03-10"
      />

      <View className="mb-6">
        <Text className="text-sm text-app-muted dark:text-app-muted-dark mb-2">
          Worth it slider
        </Text>
        <Slider
          value={sliderValue}
          minimumValue={0}
          maximumValue={100}
          step={1}
          minimumTrackTintColor="#2F6F62"
          maximumTrackTintColor="#E6E4DF"
          thumbTintColor="#2F6F62"
          onValueChange={setSliderValue}
        />
        <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-2">
          {sliderValue <= 40
            ? 'Mostly regret'
            : sliderValue >= 70
              ? 'Totally worth it'
              : 'Mixed feelings'}
        </Text>
      </View>

      <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />

      {!editingId ? (
        <View className="mb-6">
          <Text className="text-sm text-app-muted dark:text-app-muted-dark mb-2">Recurring</Text>
          <Button
            title={recurring ? 'Monthly recurring enabled' : 'Enable monthly recurring'}
            variant={recurring ? 'primary' : 'secondary'}
            onPress={() => setRecurring((value) => !value)}
          />
        </View>
      ) : null}

      <Button title={editingId ? 'Update expense' : 'Save expense'} onPress={handleSave} />
    </ScrollView>
  );
}
