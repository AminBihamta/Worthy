import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { PressableScale } from './PressableScale';
import { getWrapStats } from '../db/repositories/wrapped';
import { getWrapPeriodRange, formatWrapTitle, WrapPeriod } from '../utils/wrap';
import { formatMinor } from '../utils/money';
import { formatDate } from '../utils/time';
import { useSettingsStore } from '../state/useSettingsStore';
import { setSetting } from '../db/repositories/settings';

type WrapSlide = {
  id: string;
  kicker: string;
  title: string;
  value: string;
  sub?: string | null;
  footer?: string | null;
  icon: keyof typeof Feather.glyphMap;
};

const periodOptions: { id: WrapPeriod; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'year', label: 'Year' },
];

const slideAccents = ['#0A9396', '#EE9B00', '#38B000', '#5E60CE', '#D62828', '#005F73'];

const getValueClass = (value: string) => {
  if (value.length > 18) return 'text-3xl';
  if (value.length > 14) return 'text-4xl';
  return 'text-6xl';
};

export function WrappedCarousel({ initialPeriod }: { initialPeriod?: WrapPeriod }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { baseCurrency } = useSettingsStore();
  const [period, setPeriod] = useState<WrapPeriod>(initialPeriod ?? 'week');
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getWrapStats>> | null>(null);
  const [range, setRange] = useState(() => getWrapPeriodRange(initialPeriod ?? 'week'));
  const [index, setIndex] = useState(0);
  const window = Dimensions.get('window');
  const slideHeight = Math.max(360, Math.min(window.height * 0.55, 520));
  const arrowSize = 40;
  const arrowTop = Math.round(slideHeight / 2 - arrowSize / 2);
  const listRef = useRef<FlatList<WrapSlide>>(null);

  useEffect(() => {
    if (initialPeriod && initialPeriod !== period) {
      setPeriod(initialPeriod);
    }
  }, [initialPeriod, period]);

  const load = useCallback(async () => {
    const nextRange = getWrapPeriodRange(period);
    setRange(nextRange);
    const nextStats = await getWrapStats(nextRange.start, nextRange.end);
    setStats(nextStats);
    await setSetting(`wrap_last_viewed_${period}`, String(nextRange.end));
    setIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const wrapTitle = useMemo(() => formatWrapTitle(period, range), [period, range]);
  const totalExpenseMinor = stats?.totalExpenseMinor ?? 0;
  const totalIncomeMinor = stats?.totalIncomeMinor ?? 0;
  const totalSpent = formatMinor(totalExpenseMinor, baseCurrency);
  const totalIncome = formatMinor(totalIncomeMinor, baseCurrency);
  const netMinor = totalIncomeMinor - totalExpenseMinor;
  const netValue = formatMinor(Math.abs(netMinor), baseCurrency);
  const savingsRate =
    totalIncomeMinor > 0 ? Math.max(0, Math.round((netMinor / totalIncomeMinor) * 100)) : null;

  const topCategoryValue = stats?.topCategory?.name ?? 'No spend yet';
  const topCategoryAmount = stats?.topCategory
    ? `${formatMinor(stats.topCategory.total_minor, baseCurrency)} spent`
    : 'Start logging to unlock your vibe.';

  const biggestValue = stats?.biggestExpense
    ? formatMinor(stats.biggestExpense.amount_minor, baseCurrency)
    : 'No big spend yet';
  const biggestSub = stats?.biggestExpense?.title ?? 'Your biggest moment shows up here.';

  const topDayValue = stats?.topSpendDay?.day
    ? formatDate(new Date(`${stats.topSpendDay.day}T00:00:00`).getTime())
    : 'No spend day yet';
  const topDaySub = stats?.topSpendDay
    ? `${formatMinor(stats.topSpendDay.total_minor, baseCurrency)} spent`
    : 'Your peak day appears once you log more.';

  const activityFooter =
    stats && (stats.expenseCount > 0 || stats.incomeCount > 0)
      ? `You logged ${stats.expenseCount} expenses and ${stats.incomeCount} incomes.`
      : 'Your story starts the moment you log.';

  const slides: WrapSlide[] = useMemo(
    () => [
      {
        id: 'spend',
        kicker: wrapTitle,
        title: 'You spent',
        value: totalSpent,
        sub: totalExpenseMinor ? `That was your ${period} vibe.` : 'Log a few expenses to light this up.',
        icon: 'arrow-down-right',
      },
      {
        id: 'earn',
        kicker: `Your ${period} momentum`,
        title: 'You earned',
        value: totalIncome,
        sub: totalIncomeMinor ? 'Cash that powered your flow.' : 'Add income to power your story.',
        icon: 'arrow-up-right',
      },
      {
        id: 'net',
        kicker: 'Your money swing',
        title: netMinor >= 0 ? 'You saved' : 'You overspent',
        value: netValue,
        sub: savingsRate !== null ? `Savings rate ${savingsRate}%.` : 'Your money mood, summed up.',
        footer: activityFooter,
        icon: 'activity',
      },
      {
        id: 'category',
        kicker: 'Your go-to',
        title: 'Top category',
        value: topCategoryValue,
        sub: topCategoryAmount,
        icon: 'tag',
      },
      {
        id: 'biggest',
        kicker: 'Big moment',
        title: 'Biggest purchase',
        value: biggestValue,
        sub: biggestSub,
        icon: 'shopping-bag',
      },
      {
        id: 'day',
        kicker: 'Peak day',
        title: 'Most intense day',
        value: topDayValue,
        sub: topDaySub,
        icon: 'calendar',
      },
    ],
    [
      activityFooter,
      biggestSub,
      biggestValue,
      netMinor,
      netValue,
      period,
      savingsRate,
      topCategoryAmount,
      topCategoryValue,
      topDaySub,
      topDayValue,
      totalExpenseMinor,
      totalIncome,
      totalIncomeMinor,
      totalSpent,
      wrapTitle,
    ],
  );

  const handlePrev = () => {
    if (index > 0) {
      listRef.current?.scrollToIndex({ index: index - 1, animated: true });
    }
  };

  const handleNext = () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  };

  return (
    <View className="mb-8">
      <View className="flex-row gap-2 mb-4">
        {periodOptions.map((option) => {
          const isActive = option.id === period;
          return (
            <PressableScale
              key={option.id}
              onPress={() => setPeriod(option.id)}
              className={`px-4 py-2 rounded-full border ${
                isActive
                  ? 'border-app-brand dark:border-app-brand-dark bg-app-soft dark:bg-app-soft-dark'
                  : 'border-app-border dark:border-app-border-dark'
              }`}
            >
              <Text
                className={`text-sm ${
                  isActive
                    ? 'text-app-brand dark:text-app-brand-dark'
                    : 'text-app-text dark:text-app-text-dark'
                }`}
              >
                {option.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <View className="flex-row gap-2 mb-4">
        {slides.map((slide, dotIndex) => (
          <View
            key={slide.id}
            className="h-1.5 flex-1 rounded-full"
            style={{
              backgroundColor:
                dotIndex <= index ? '#0A9396' : isDark ? '#2B2F36' : '#D1DDE6',
            }}
          />
        ))}
      </View>

      <View className="relative">
        <FlatList
          ref={listRef}
          data={slides}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / window.width);
            setIndex(nextIndex);
          }}
          renderItem={({ item, index: slideIndex }) => {
            const accent = slideAccents[slideIndex % slideAccents.length];
            const valueClass = getValueClass(item.value);
            return (
              <View style={{ width: window.width - 48, height: slideHeight }} className="mr-4">
                <View className="flex-1 rounded-[40px] border border-app-border/50 dark:border-app-border-dark/50 bg-app-card dark:bg-app-card-dark overflow-hidden">
                  <Animated.View
                    entering={FadeIn.duration(400)}
                    className="absolute -top-24 -right-12 w-48 h-48 rounded-full"
                    style={{ backgroundColor: accent, opacity: 0.2 }}
                  />
                  <Animated.View
                    entering={FadeIn.duration(450)}
                    className="absolute -bottom-24 -left-16 w-52 h-52 rounded-full"
                    style={{ backgroundColor: accent, opacity: 0.12 }}
                  />
                  <Animated.View
                    entering={FadeIn.duration(500)}
                    className="absolute top-10 left-8 w-20 h-20 rounded-3xl"
                    style={{ backgroundColor: accent, opacity: 0.08, transform: [{ rotate: '-12deg' }] }}
                  />

                  <View className="absolute top-6 right-6 w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: accent }}>
                    <Feather name={item.icon} size={20} color="#FFFFFF" />
                  </View>

                  <View className="flex-1 p-8 items-center justify-center">
                    <Animated.View entering={FadeInUp.duration(420)} className="items-center">
                      <Text className="text-sm uppercase tracking-widest text-app-muted dark:text-app-muted-dark text-center">
                        {item.kicker}
                      </Text>
                      <Text className="text-3xl font-display text-app-text dark:text-app-text-dark text-center mt-3">
                        {item.title}
                      </Text>
                    </Animated.View>

                    <Animated.Text
                      entering={FadeInUp.delay(140).duration(520)}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      className={`${valueClass} font-display text-center mt-6`}
                      style={{ color: accent }}
                    >
                      {item.value}
                    </Animated.Text>

                    {item.sub ? (
                      <Animated.Text
                        entering={FadeInUp.delay(220).duration(520)}
                        className="text-base text-app-muted dark:text-app-muted-dark text-center mt-4"
                      >
                        {item.sub}
                      </Animated.Text>
                    ) : null}

                    {item.footer ? (
                      <Animated.Text
                        entering={FadeInUp.delay(280).duration(520)}
                        className="text-xs text-app-muted dark:text-app-muted-dark text-center mt-4"
                      >
                        {item.footer}
                      </Animated.Text>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          }}
        />

        
      </View>
    </View>
  );
}
