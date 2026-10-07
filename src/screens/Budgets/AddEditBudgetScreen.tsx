import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Button } from '../../components/Button';
import { KeyboardFormView } from '../../components/KeyboardFormView';
import { PressableScale } from '../../components/PressableScale';
import { SelectionModal } from '../../components/SelectionModal';
import { listCategories } from '../../db/repositories/categories';
import { createBudget, listBudgets, updateBudget } from '../../db/repositories/budgets';
import { CurrencyRow, listCurrencies } from '../../db/repositories/currencies';
import { useSettingsStore } from '../../state/useSettingsStore';
import { formatAmountInput, formatMinorInput, toMinor } from '../../utils/money';
import { BudgetPeriodType } from '../../db/repositories/budgets';
import {
  BudgetAveragePeriod,
  isBudgetAveragePeriodAllowed,
} from '../../utils/budgetAverage';

export default function AddEditBudgetScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { baseCurrency } = useSettingsStore();
  const params = route.params as { id?: string } | undefined;
  const editingId = params?.id;

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [periodType, setPeriodType] = useState<BudgetPeriodType>('month');
  const [averagePeriod, setAveragePeriod] = useState<BudgetAveragePeriod>('off');
  const [categories, setCategories] = useState<
    { id: string; name: string; icon?: keyof typeof Feather.glyphMap; iconColor?: string }[]
  >([]);
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  useEffect(() => {
    listCategories().then((cats) => {
      setCategories(
        cats.map((cat) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon as keyof typeof Feather.glyphMap,
          iconColor: cat.color,
        })),
      );
      if (!categoryId && cats.length > 0) setCategoryId(cats[0].id);
    });
  }, [categoryId]);

  useEffect(() => {
    listCurrencies().then(setCurrencies);
  }, []);

  useEffect(() => {
    if (!editingId) return;
    listBudgets(true).then((budgets) => {
      const budget = budgets.find((item) => item.id === editingId);
      if (!budget) return;
      setCategoryId(budget.category_id);
      setAmount(formatMinorInput(budget.amount_minor));
      setPeriodType(budget.period_type as BudgetPeriodType);
      setAveragePeriod(budget.average_period ?? 'off');
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
        average_period: averagePeriod,
      });
      navigation.goBack();
      return;
    }

    await createBudget({
      category_id: categoryId,
      amount_minor: amountMinor,
      period_type: periodType,
      average_period: averagePeriod,
      start_date_ts: Date.now(),
    });
    navigation.goBack();
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedCurrency = currencies.find((currency) => currency.code === baseCurrency);
  const currencySymbol =
    selectedCurrency?.symbol ??
    (baseCurrency === 'EUR' ? '€' : baseCurrency === 'USD' ? '$' : baseCurrency);
  const periodOptions = [
    { id: 'month', name: 'Monthly' },
    { id: 'week', name: 'Weekly' },
    { id: 'year', name: 'Yearly' },
  ];
  const selectedPeriod = periodOptions.find((p) => p.id === periodType);
  const averageOptions: { id: BudgetAveragePeriod; label: string }[] = [
    { id: 'off', label: 'Off' },
    ...(periodType === 'month' || periodType === 'year'
      ? [{ id: 'daily' as const, label: 'Daily' }]
      : []),
    ...(periodType === 'month' || periodType === 'year'
      ? [{ id: 'weekly' as const, label: 'Weekly' }]
      : []),
    ...(periodType === 'year' ? [{ id: 'monthly' as const, label: 'Monthly' }] : []),
  ];

  const handlePeriodTypeChange = (id: string) => {
    const nextPeriodType = id as BudgetPeriodType;
    setPeriodType(nextPeriodType);
    if (!isBudgetAveragePeriodAllowed(nextPeriodType, averagePeriod)) setAveragePeriod('off');
  };

  return (
    <KeyboardFormView className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Hero Section */}
        <View className="pt-8 pb-8 px-6 items-center justify-center">
          <View className="flex-row items-baseline justify-center">
            <Text className="text-4xl font-display text-app-muted dark:text-app-muted-dark mr-1">
              {currencySymbol}
            </Text>
            <TextInput
              value={amount}
              onChangeText={(value) => setAmount(formatAmountInput(value))}
              placeholder="0.00"
              placeholderTextColor={isDark ? '#30363D' : '#D1DDE6'}
              keyboardType="decimal-pad"
              className="font-display text-app-text dark:text-app-text-dark text-center"
              style={{ fontSize: 60, lineHeight: 76, paddingTop: 6, paddingBottom: 4 }}
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
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={
                      selectedCategory?.iconColor
                        ? { backgroundColor: `${selectedCategory.iconColor}1A` }
                        : undefined
                    }
                  >
                    <Feather
                      name={selectedCategory?.icon ?? 'tag'}
                      size={20}
                      color={selectedCategory?.iconColor ?? (isDark ? '#E6EDF3' : '#0D1B2A')}
                    />
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

            {/* Remaining average */}
            <View className="p-5 border-t border-app-border/30 dark:border-app-border-dark/30">
              <Text className="text-base font-medium text-app-text dark:text-app-text-dark mb-1">
                Remaining average
              </Text>
              <Text className="text-sm text-app-muted dark:text-app-muted-dark mb-3">
                Average available to spend through this period’s end.
              </Text>
              <View
                className="flex-row rounded-2xl bg-app-soft dark:bg-app-soft-dark p-1"
                accessibilityRole="radiogroup"
                accessibilityLabel="Remaining average period"
              >
                {averageOptions.map((option) => {
                  const selected = averagePeriod === option.id;
                  return (
                    <PressableScale
                      key={option.id}
                      onPress={() => setAveragePeriod(option.id)}
                      accessibilityRole="radio"
                      accessibilityLabel={option.label}
                      accessibilityState={{ checked: selected }}
                      className={`min-h-11 flex-1 items-center justify-center rounded-xl px-2 ${
                        selected ? 'bg-app-card dark:bg-app-card-dark' : ''
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selected
                            ? 'text-app-text dark:text-app-text-dark'
                            : 'text-app-muted dark:text-app-muted-dark'
                        }`}
                      >
                        {option.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
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
        onSelect={handlePeriodTypeChange}
        selectedId={periodType}
      />
    </KeyboardFormView>
  );
}
