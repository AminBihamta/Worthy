import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import * as Haptics from 'expo-haptics';
import { PeriodType } from '../utils/period';
import { PressableScale } from './PressableScale';

interface PeriodSelectorProps {
  period: PeriodType;
  date: Date;
  onChangeDate: (date: Date) => void;
  onChangePeriod: (period: PeriodType) => void;
}

export function PeriodSelector({
  period,
  date,
  onChangeDate,
  onChangePeriod,
}: PeriodSelectorProps) {
  const handlePrev = () => {
    Haptics.selectionAsync();
    if (period === 'week') onChangeDate(subWeeks(date, 1));
    else if (period === 'month') onChangeDate(subMonths(date, 1));
    else onChangeDate(subYears(date, 1));
  };

  const handleNext = () => {
    Haptics.selectionAsync();
    if (period === 'week') onChangeDate(addWeeks(date, 1));
    else if (period === 'month') onChangeDate(addMonths(date, 1));
    else onChangeDate(addYears(date, 1));
  };

  const getLabel = () => {
    let start, end;
    if (period === 'week') {
      start = startOfWeek(date, { weekStartsOn: 1 });
      end = endOfWeek(date, { weekStartsOn: 1 });
    } else if (period === 'month') {
      start = startOfMonth(date);
      end = endOfMonth(date);
    } else {
      start = startOfYear(date);
      end = endOfYear(date);
    }

    if (start.getFullYear() !== end.getFullYear()) {
      return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
    }
    if (start.getMonth() !== end.getMonth()) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
  };

  const PeriodTab = ({ value, label }: { value: PeriodType; label: string }) => {
    const isActive = period === value;
    return (
      <PressableScale
        onPress={() => {
          Haptics.selectionAsync();
          onChangePeriod(value);
        }}
        className={`px-4 py-2 rounded-full ${
          isActive ? 'bg-app-text dark:bg-app-text-dark' : 'bg-transparent'
        }`}
      >
        <Text
          className={`text-sm font-bold ${
            isActive ? 'text-app-bg dark:text-app-bg-dark' : 'text-app-muted dark:text-app-muted-dark'
          }`}
        >
          {label}
        </Text>
      </PressableScale>
    );
  };

  return (
    <View className="mb-6">
      {/* Period Type Selector */}
      <View className="flex-row justify-center space-x-2 mb-4">
        <PeriodTab value="week" label="Week" />
        <PeriodTab value="month" label="Month" />
        <PeriodTab value="year" label="Year" />
      </View>

      {/* Date Navigation */}
      <View className="flex-row items-center justify-between bg-app-card dark:bg-app-card-dark p-2 rounded-full border border-app-border/50 dark:border-app-border-dark/50 shadow-sm">
        <PressableScale
          onPress={handlePrev}
          className="w-10 h-10 rounded-full items-center justify-center bg-app-soft dark:bg-app-soft-dark"
        >
          <Feather name="chevron-left" size={20} color="#8A6B9A" />
        </PressableScale>

        <Text className="text-base font-display text-app-text dark:text-app-text-dark">
          {getLabel()}
        </Text>

        <PressableScale
          onPress={handleNext}
          className="w-10 h-10 rounded-full items-center justify-center bg-app-soft dark:bg-app-soft-dark"
        >
          <Feather name="chevron-right" size={20} color="#8A6B9A" />
        </PressableScale>
      </View>
    </View>
  );
}
