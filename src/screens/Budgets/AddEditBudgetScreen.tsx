import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SelectField } from '../../components/SelectField';
import { listCategories } from '../../db/repositories/categories';
import { createBudget, listBudgets, updateBudget } from '../../db/repositories/budgets';
import { toMinor } from '../../utils/money';

export default function AddEditBudgetScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { id?: string } | undefined;
  const editingId = params?.id;

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [periodType, setPeriodType] = useState('month');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    listCategories().then((cats) => {
      setCategories(cats.map((cat) => ({ id: cat.id, name: cat.name })));
      if (!categoryId && cats.length > 0) setCategoryId(cats[0].id);
    });
  }, [categoryId]);

  useEffect(() => {
    if (!editingId) return;
    listBudgets(true).then((budgets) => {
      const budget = budgets.find((item) => item.id === editingId);
      if (!budget) return;
      setCategoryId(budget.category_id);
      setAmount(String(budget.amount_minor / 100));
      setPeriodType(budget.period_type);
    });
  }, [editingId]);

  const handleSave = async () => {
    if (!categoryId) return;
    const amountMinor = toMinor(amount);
    if (editingId) {
      await updateBudget(editingId, {
        category_id: categoryId,
        amount_minor: amountMinor,
        period_type: periodType,
      });
      navigation.goBack();
      return;
    }

    await createBudget({
      category_id: categoryId,
      amount_minor: amountMinor,
      period_type: periodType,
      start_date_ts: Date.now(),
    });
    navigation.goBack();
  };

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 20 }}
    >
      <SelectField
        label="Category"
        value={categoryId}
        options={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
        onChange={setCategoryId}
      />
      <Input
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
      <SelectField
        label="Period"
        value={periodType}
        options={[
          { label: 'Monthly', value: 'month' },
          { label: 'Weekly (coming soon)', value: 'week' },
          { label: 'Yearly', value: 'year' },
        ]}
        onChange={setPeriodType}
      />
      <Button title={editingId ? 'Update budget' : 'Save budget'} onPress={handleSave} />
    </ScrollView>
  );
}
