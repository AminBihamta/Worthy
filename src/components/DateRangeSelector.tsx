import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  isSameYear,
} from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';
import { PressableScale } from './PressableScale';
import type { PeriodType } from '../utils/period';

interface DateRangeSelectorProps {
  period: PeriodType;
  date: Date;
  onChangeDate: (date: Date) => void;
  onChangePeriod: (period: PeriodType) => void;
}

export function DateRangeSelector({
  period,
  date,
  onChangeDate,
  onChangePeriod,
}: DateRangeSelectorProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#8B949E' : '#6B7A8F';
  const [isSelecting, setIsSelecting] = useState(false);

  const { start, end } = useMemo(() => {
    if (period === 'week') {
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    }
    if (period === 'month') {
      return { start: startOfMonth(date), end: endOfMonth(date) };
    }
    return { start: startOfYear(date), end: endOfYear(date) };
  }, [date, period]);

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

  const handlePeriodSelect = (newPeriod: PeriodType) => {
    Haptics.selectionAsync();
    onChangePeriod(newPeriod);
    setIsSelecting(false);
  };

  const formattedLabel = useMemo(() => {
    if (period === 'year') {
      return format(start, 'yyyy');
    }
    if (period === 'month') {
      return format(start, 'MMMM yyyy');
    }
    // Week
    if (isSameYear(start, end)) {
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
      }
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
  }, [start, end, period]);

  const PeriodButton = ({
    type,
    label,
  }: {
    type: PeriodType;
    label: string;
  }) => {
    const isActive = period === type;
    return (
      <PressableScale
        onPress={() => handlePeriodSelect(type)}
        className={`px-3 py-1.5 rounded-full ${
          isActive ? 'bg-app-brand dark:bg-app-brand-dark' : 'bg-transparent'
        }`}
      >
        <Text
          className={`text-sm font-display ${
            isActive
              ? 'text-white'
              : 'text-app-muted dark:text-app-muted-dark'
          }`}
        >
          {label}
        </Text>
      </PressableScale>
    );
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between bg-app-card dark:bg-app-card-dark p-1.5 rounded-full border border-app-border/50 dark:border-app-border-dark/50 shadow-sm min-h-[56px]">
        <PressableScale
          onPress={handlePrev}
          className="w-10 h-10 rounded-full items-center justify-center bg-app-soft dark:bg-app-soft-dark"
        >
          <Feather name="chevron-left" size={20} color={iconColor} />
        </PressableScale>

        <View className="flex-1 items-center justify-center">
          {isSelecting ? (
            <View className="flex-row items-center gap-1">
              <PeriodButton type="week" label="Week" />
              <PeriodButton type="month" label="Month" />
              <PeriodButton type="year" label="Year" />
            </View>
          ) : (
            <PressableScale
              onPress={() => {
                Haptics.selectionAsync();
                setIsSelecting(true);
              }}
              className="flex-row items-center gap-2 px-4 py-2"
            >
              <Text className="text-base font-display text-app-text dark:text-app-text-dark">
                {formattedLabel}
              </Text>
              <Feather name="chevron-down" size={16} color={iconColor} />
            </PressableScale>
          )}
        </View>

        <PressableScale
          onPress={handleNext}
          className="w-10 h-10 rounded-full items-center justify-center bg-app-soft dark:bg-app-soft-dark"
        >
          <Feather name="chevron-right" size={20} color={iconColor} />
        </PressableScale>
      </View>
    </View>
  );
}
