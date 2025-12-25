import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addDays, addMonths, addWeeks, addYears } from 'date-fns';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SelectField } from '../../components/SelectField';
import { listAccounts } from '../../db/repositories/accounts';
import { createIncome, getIncome, updateIncome } from '../../db/repositories/incomes';
import { createRecurringRule } from '../../db/repositories/recurring';
import { toMinor } from '../../utils/money';

export default function AddEditIncomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { id?: string } | undefined;
  const editingId = params?.id;

  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [hoursWorked, setHoursWorked] = useState('');
  const [notes, setNotes] = useState('');
  const [recurrence, setRecurrence] = useState<
    'off' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
  >('off');

  const [accounts, setAccounts] = useState<{ id: string; name: string; currency: string }[]>([]);

  useEffect(() => {
    listAccounts().then((accts) => {
      setAccounts(accts.map((acct) => ({ id: acct.id, name: acct.name, currency: acct.currency })));
      if (!accountId && accts.length > 0) setAccountId(accts[0].id);
    });
  }, [accountId]);

  useEffect(() => {
    if (!editingId) return;
    getIncome(editingId).then((income) => {
      if (!income) return;
      setSource(income.source);
      setAmount(String(income.amount_minor / 100));
      setAccountId(income.account_id);
      setDateInput(new Date(income.date_ts).toISOString().slice(0, 10));
      setHoursWorked(income.hours_worked ? String(income.hours_worked) : '');
      setNotes(income.notes ?? '');
    });
  }, [editingId]);

  const handleSave = async () => {
    if (!accountId) return;
    const amountMinor = toMinor(amount);
    const parsedDate = new Date(dateInput);
    const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const finalDateTs = safeDate.setHours(12, 0, 0, 0);
    const hours = hoursWorked ? Number.parseFloat(hoursWorked) : null;

    if (editingId) {
      await updateIncome(editingId, {
        source,
        amount_minor: amountMinor,
        account_id: accountId,
        date_ts: finalDateTs,
        hours_worked: hours,
        notes,
      });
      navigation.goBack();
      return;
    }

    const id = await createIncome({
      source,
      amount_minor: amountMinor,
      account_id: accountId,
      date_ts: finalDateTs,
      hours_worked: hours,
      notes,
    });

    if (recurrence !== 'off') {
      const rruleText =
        recurrence === 'daily'
          ? 'FREQ=DAILY;INTERVAL=1'
          : recurrence === 'weekly'
            ? 'FREQ=WEEKLY;INTERVAL=1'
            : recurrence === 'biweekly'
              ? 'FREQ=WEEKLY;INTERVAL=2'
              : recurrence === 'yearly'
                ? 'FREQ=YEARLY;INTERVAL=1'
                : 'FREQ=MONTHLY;INTERVAL=1';
      const nextRun =
        recurrence === 'daily'
          ? addDays(new Date(finalDateTs), 1).getTime()
          : recurrence === 'weekly'
            ? addWeeks(new Date(finalDateTs), 1).getTime()
            : recurrence === 'biweekly'
              ? addWeeks(new Date(finalDateTs), 2).getTime()
              : recurrence === 'yearly'
                ? addYears(new Date(finalDateTs), 1).getTime()
                : addMonths(new Date(finalDateTs), 1).getTime();
      await createRecurringRule({
        entity_type: 'income',
        entity_id: id,
        rrule_text: rruleText,
        next_run_ts: nextRun,
      });
    }

    navigation.goBack();
  };

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 24 }}
    >
      <Input label="Source" value={source} onChangeText={setSource} placeholder="e.g. Salary" />
      <Input
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
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
        onChangeText={setDateInput}
        placeholder="2025-03-10"
      />
      <Input
        label="Hours worked"
        value={hoursWorked}
        onChangeText={setHoursWorked}
        placeholder="Optional"
        keyboardType="decimal-pad"
      />
      <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />

      {!editingId ? (
        <View className="mb-6">
          <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-2">
            Recurring
          </Text>
          <SelectField
            label="Frequency"
            value={recurrence}
            options={[
              { label: 'Off', value: 'off' },
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Biweekly', value: 'biweekly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Yearly', value: 'yearly' },
            ]}
            onChange={(value) => setRecurrence(value as typeof recurrence)}
          />
        </View>
      ) : null}

      <Button title={editingId ? 'Update income' : 'Save income'} onPress={handleSave} />
    </ScrollView>
  );
}
