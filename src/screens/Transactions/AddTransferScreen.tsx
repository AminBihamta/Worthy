import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SelectField } from '../../components/SelectField';
import { listAccounts } from '../../db/repositories/accounts';
import { createTransfer } from '../../db/repositories/transfers';
import { toMinor } from '../../utils/money';

export default function AddTransferScreen() {
  const navigation = useNavigation();
  const [accounts, setAccounts] = useState<{ id: string; name: string; currency: string }[]>([]);
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    listAccounts().then((accts) => {
      setAccounts(accts.map((acct) => ({ id: acct.id, name: acct.name, currency: acct.currency })));
      if (!fromAccountId && accts.length > 0) setFromAccountId(accts[0].id);
      if (!toAccountId && accts.length > 1) setToAccountId(accts[1].id);
    });
  }, [fromAccountId, toAccountId]);

  const handleSave = async () => {
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) return;
    const amountMinor = toMinor(amount);
    const parsedDate = new Date(dateInput);
    const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const finalDateTs = safeDate.setHours(12, 0, 0, 0);

    await createTransfer({
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      amount_minor: amountMinor,
      date_ts: finalDateTs,
      notes,
    });
    navigation.goBack();
  };

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 24 }}
    >
      <SelectField
        label="From account"
        value={fromAccountId}
        options={accounts.map((acct) => ({
          label: `${acct.name} (${acct.currency})`,
          value: acct.id,
        }))}
        onChange={setFromAccountId}
      />
      <SelectField
        label="To account"
        value={toAccountId}
        options={accounts.map((acct) => ({
          label: `${acct.name} (${acct.currency})`,
          value: acct.id,
        }))}
        onChange={setToAccountId}
      />
      <Input
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
      <Input
        label="Date (YYYY-MM-DD)"
        value={dateInput}
        onChangeText={setDateInput}
        placeholder="2025-03-10"
      />
      <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />
      <Button title="Save transfer" onPress={handleSave} />
    </ScrollView>
  );
}
