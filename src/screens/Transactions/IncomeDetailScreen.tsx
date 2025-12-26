import React, { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { PressableScale } from '../../components/PressableScale';
import { Card } from '../../components/Card';
import { deleteIncome, getIncome, IncomeListRow } from '../../db/repositories/incomes';
import { formatMinor } from '../../utils/money';
import { formatDate, formatDateTime } from '../../utils/time';
import { Button } from '../../components/Button';
import { getRecurringRuleForEntity, RecurringRuleRow } from '../../db/repositories/recurring';
import { formatRRule } from '../../utils/recurring';

export default function IncomeDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = route.params as { id: string } | undefined;
  const [income, setIncome] = useState<IncomeListRow | null>(null);
  const [recurringRule, setRecurringRule] = useState<RecurringRuleRow | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!params?.id) return;
      let active = true;

      const load = async () => {
        const [row, recurring] = await Promise.all([
          getIncome(params.id),
          getRecurringRuleForEntity('income', params.id),
        ]);

        if (active) {
          setIncome(row);
          setRecurringRule(recurring);
        }
      };

      load();

      return () => {
        active = false;
      };
    }, [params?.id]),
  );

  const handleDelete = async () => {
    if (!income) return;
    Alert.alert('Delete income?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteIncome(income.id);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!income) {
    return (
      <View className="flex-1 bg-app-bg dark:bg-app-bg-dark items-center justify-center">
        <Text className="text-app-muted dark:text-app-muted-dark">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Header Actions */}
        <View className="flex-row justify-between items-center px-6 pt-4">
          <PressableScale
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center"
          >
            <Feather name="arrow-left" size={20} color={isDark ? '#F9E6F4' : '#2C0C4D'} />
          </PressableScale>
          <PressableScale
            onPress={() => setMenuOpen(true)}
            className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center"
          >
            <Feather name="more-horizontal" size={20} color={isDark ? '#F9E6F4' : '#2C0C4D'} />
          </PressableScale>
        </View>

        {/* Hero Section */}
        <View className="items-center pt-16 pb-8 px-6">
          <Text className="text-7xl font-display text-app-success dark:text-app-success text-center pt-4 leading-tight">
            +{formatMinor(income.amount_minor)}
          </Text>
          <Text className="text-xl text-app-muted dark:text-app-muted-dark text-center mt-2 font-medium">
            {income.source}
          </Text>
        </View>

        {/* Main Details Card */}
        <View className="px-4 space-y-4">
          <View className="bg-app-card dark:bg-app-card-dark rounded-3xl overflow-hidden border border-app-border/50 dark:border-app-border-dark/50">
            {/* Account */}
            <View className="flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                  <Feather name="credit-card" size={18} color={isDark ? '#F9E6F4' : '#2C0C4D'} />
                </View>
                <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Account</Text>
              </View>
              <Text className="text-base text-app-muted dark:text-app-muted-dark">
                {income.account_name}
              </Text>
            </View>

            {/* Date */}
            <View className="flex-row items-center justify-between p-5">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                  <Feather name="calendar" size={18} color={isDark ? '#F9E6F4' : '#2C0C4D'} />
                </View>
                <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Date</Text>
              </View>
              <Text className="text-base text-app-muted dark:text-app-muted-dark">
                {formatDate(income.date_ts)}
              </Text>
            </View>
          </View>

          {/* Hours Worked (if applicable) */}
          {income.hours_worked ? (
            <View className="bg-app-card dark:bg-app-card-dark rounded-3xl p-5 border border-app-border/50 dark:border-app-border-dark/50 flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                  <Feather name="clock" size={18} color={isDark ? '#F9E6F4' : '#2C0C4D'} />
                </View>
                <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Hours Worked</Text>
              </View>
              <Text className="text-xl font-display text-app-text dark:text-app-text-dark">
                {income.hours_worked}
              </Text>
            </View>
          ) : null}

          {/* Notes */}
          {income.notes ? (
            <View className="bg-app-card dark:bg-app-card-dark rounded-3xl p-5 border border-app-border/50 dark:border-app-border-dark/50">
              <View className="flex-row items-center gap-3 mb-2">
                <Feather name="file-text" size={16} color={isDark ? '#C8A9C2' : '#8A6B9A'} />
                <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
                  Notes
                </Text>
              </View>
              <Text className="text-base text-app-text dark:text-app-text-dark leading-6">
                {income.notes}
              </Text>
            </View>
          ) : null}

          {/* Recurring Info */}
          {recurringRule && (
            <View className="bg-app-soft dark:bg-app-soft-dark rounded-3xl p-5 flex-row items-center gap-4 border border-app-brand/20 dark:border-app-brand-dark/20">
              <View className="w-10 h-10 rounded-full bg-app-brand dark:bg-app-brand-dark items-center justify-center">
                <Feather name="repeat" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text className="text-base font-medium text-app-brand dark:text-app-brand-dark">
                  Recurring Income
                </Text>
                <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                  Repeats {formatRRule(recurringRule.rrule_text).toLowerCase()}
                </Text>
              </View>
            </View>
          )}

          <View className="mt-2 items-center">
            <Text className="text-xs text-app-muted dark:text-app-muted-dark">
              Created {formatDateTime(income.created_at)}
            </Text>
          </View>
        </View>

        <View className="px-6 mt-8">
          <Button
            title="Edit Income"
            onPress={() => navigation.navigate('AddEditIncome', { id: income.id })}
            variant="secondary"
            icon={<Feather name="edit-2" size={18} color={isDark ? '#F9E6F4' : '#2C0C4D'} />}
          />
        </View>
      </ScrollView>

      {/* Menu Modal */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setMenuOpen(false)}>
          <View className="bg-app-card dark:bg-app-card-dark rounded-t-[32px] p-6 pb-10">
            <View className="items-center mb-6">
              <View className="w-12 h-1.5 rounded-full bg-app-border dark:bg-app-border-dark" />
            </View>
            <PressableScale
              className="flex-row items-center p-4 rounded-2xl bg-app-danger/10 mb-2"
              onPress={() => {
                setMenuOpen(false);
                setTimeout(handleDelete, 200);
              }}
            >
              <View className="w-10 h-10 rounded-full bg-app-danger/20 items-center justify-center mr-4">
                <Feather name="trash-2" size={20} color="#EF4444" />
              </View>
              <Text className="text-lg font-medium text-app-danger">Delete Income</Text>
            </PressableScale>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
