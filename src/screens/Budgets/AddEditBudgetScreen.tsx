import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Button } from '../../components/Button';
import { PressableScale } from '../../components/PressableScale';
import { SelectionModal } from '../../components/SelectionModal';
import { listCategories } from '../../db/repositories/categories';
import { createBudget, listBudgets, updateBudget } from '../../db/repositories/budgets';
import { toMinor } from '../../utils/money';

export default function AddEditBudgetScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = route.params as { id?: string } | undefined;
  const editingId = params?.id;

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [periodType, setPeriodType] = useState('month');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

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

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const periodOptions = [
    { id: 'month', name: 'Monthly' },
    { id: 'week', name: 'Weekly (coming soon)' },
    { id: 'year', name: 'Yearly' },
  ];
  const selectedPeriod = periodOptions.find((p) => p.id === periodType);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View className="pt-8 pb-8 px-6 items-center justify-center">
          <View className="flex-row items-baseline justify-center">
            <Text className="text-4xl font-display text-app-muted dark:text-app-muted-dark mr-1">
              $
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={isDark ? '#30363D' : '#D1DDE6'}
              keyboardType="decimal-pad"
              className="text-6xl font-display text-app-text dark:text-app-text-dark text-center"
              autoFocus={!editingId}
            />
          </View>
          <Text className="text-xl text-app-text dark:text-app-text-dark text-center mt-2 font-medium">
            Budget Limit
          </Text>
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
                  <Text className="text-base font-medium text-app-text dark:text-app-text-dark">
                    {selectedCategory?.name || 'Select Category'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={isDark ? '#8B949E' : '#6B7A8F'} />
              </View>
            </PressableScale>

            {/* Period Row */}
            <PressableScale onPress={() => setShowPeriodModal(true)}>
              <View className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                    <Feather name="calendar" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                  </View>
                  <Text className="text-base font-medium text-app-text dark:text-app-text-dark">
                    {selectedPeriod?.name || 'Select Period'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={isDark ? '#8B949E' : '#6B7A8F'} />
              </View>
            </PressableScale>
          </View>
        </View>

        <View className="px-6 mt-8">
          <Button
            title={editingId ? 'Update Budget' : 'Save Budget'}
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
        visible={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        title="Select Period"
        options={periodOptions}
        onSelect={setPeriodType}
        selectedId={periodType}
      />
    </KeyboardAvoidingView>
  );
}
