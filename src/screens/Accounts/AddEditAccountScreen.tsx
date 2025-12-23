import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SelectField } from '../../components/SelectField';
import { createAccount, getAccount, updateAccount } from '../../db/repositories/accounts';
import { toMinor } from '../../utils/money';

export default function AddEditAccountScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { id?: string } | undefined;
  const editingId = params?.id;

  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [currency, setCurrency] = useState('USD');
  const [startingBalance, setStartingBalance] = useState('');

  useEffect(() => {
    if (!editingId) return;
    getAccount(editingId).then((account) => {
      if (!account) return;
      setName(account.name);
      setType(account.type);
      setCurrency(account.currency);
      setStartingBalance(String(account.starting_balance_minor / 100));
    });
  }, [editingId]);

  const handleSave = async () => {
    if (editingId) {
      await updateAccount(editingId, {
        name,
        type: type as any,
        currency,
        starting_balance_minor: toMinor(startingBalance),
      });
      navigation.goBack();
      return;
    }

    await createAccount({
      name,
      type: type as any,
      currency,
      starting_balance_minor: toMinor(startingBalance),
    });
    navigation.goBack();
  };

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 20 }}
    >
      <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Cash" />
      <SelectField
        label="Type"
        value={type}
        options={[
          { label: 'Cash', value: 'cash' },
          { label: 'Bank', value: 'bank' },
          { label: 'E-wallet', value: 'ewallet' },
          { label: 'Credit Card', value: 'credit' },
        ]}
        onChange={setType}
      />
      <Input label="Currency" value={currency} onChangeText={setCurrency} placeholder="USD" />
      <Input
        label="Starting balance"
        value={startingBalance}
        onChangeText={setStartingBalance}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
      <Button title={editingId ? 'Update account' : 'Save account'} onPress={handleSave} />
    </ScrollView>
  );
}
