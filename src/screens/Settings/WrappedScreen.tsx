import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '../../components/Button';
import { PressableScale } from '../../components/PressableScale';
import { getWrapStats } from '../../db/repositories/wrapped';
import { getWrapPeriodRange, formatWrapTitle, WrapPeriod } from '../../utils/wrap';
import { formatMinor } from '../../utils/money';
import { useSettingsStore } from '../../state/useSettingsStore';
import { setSetting } from '../../db/repositories/settings';

const periodOptions: { id: WrapPeriod; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'year', label: 'Year' },
];

const slideAccents = ['#0A9396', '#EE9B00', '#38B000', '#5E60CE', '#D62828'];

export default function WrappedScreen({ navigation }: { navigation: any }) {
  const route = useRoute();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { baseCurrency } = useSettingsStore();
  const initialPeriod = (route.params as { period?: WrapPeriod } | undefined)?.period ?? 'week';
  const [period, setPeriod] = useState<WrapPeriod>(initialPeriod);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getWrapStats>> | null>(null);
  const [range, setRange] = useState(() => getWrapPeriodRange('week'));
  const [index, setIndex] = useState(0);
  const width = Dimensions.get('window').width;
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    const nextRange = getWrapPeriodRange(period);
    setRange(nextRange);
    const nextStats = await getWrapStats(nextRange.start, nextRange.end);
    setStats(nextStats);
    await setSetting(`wrap_last_viewed_${period}`, String(nextRange.end));
  }, [period]);

  React.useEffect(() => {
    load();
  }, [load]);

  const wrapTitle = useMemo(() => formatWrapTitle(period, range), [period, range]);
  const totalSpent = formatMinor(stats?.totalExpenseMinor ?? 0, baseCurrency);
  const totalIncome = formatMinor(stats?.totalIncomeMinor ?? 0, baseCurrency);
  const net = (stats?.totalIncomeMinor ?? 0) - (stats?.totalExpenseMinor ?? 0);
  const savingsRate =
    stats && stats.totalIncomeMinor > 0
      ? Math.max(0, Math.round((net / stats.totalIncomeMinor) * 100))
      : null;

  const slides = useMemo(
    () => [
      {
        id: 'cover',
        title: `Your ${period} wrap`,
        value: wrapTitle,
        description: 'Here’s your money story from the last period.',
        icon: 'star',
      },
      {
        id: 'flow',
        title: 'Money flow',
        value: totalSpent,
        description: `Income: ${totalIncome}${savingsRate !== null ? ` · Saved ${savingsRate}%` : ''}`,
        icon: 'trending-up',
      },
      {
        id: 'category',
        title: 'Top category',
        value: stats?.topCategory?.name ?? 'No spend yet',
        description: stats?.topCategory
          ? `${formatMinor(stats.topCategory.total_minor, baseCurrency)} spent`
          : 'Add a few expenses to unlock this.',
        icon: 'tag',
      },
      {
        id: 'biggest',
        title: 'Biggest purchase',
        value: stats?.biggestExpense?.title ?? 'No expense yet',
        description: stats?.biggestExpense
          ? `${formatMinor(stats.biggestExpense.amount_minor, baseCurrency)}`
          : 'Your biggest purchase will show here.',
        icon: 'shopping-bag',
      },
      {
        id: 'moment',
        title: 'Most intense day',
        value: stats?.topSpendDay?.day ?? '—',
        description: stats?.topSpendDay
          ? `${formatMinor(stats.topSpendDay.total_minor, baseCurrency)} spent`
          : 'Spend data lights up this slide.',
        icon: 'calendar',
      },
    ],
    [baseCurrency, period, savingsRate, stats, totalIncome, totalSpent, wrapTitle],
  );

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <View className="px-6 pt-6">
        <Text className="text-3xl font-display text-app-text dark:text-app-text-dark">
          Wrapped
        </Text>
        <Text className="text-base text-app-muted dark:text-app-muted-dark mt-1">
          {wrapTitle}
        </Text>
      </View>

      <View className="px-6 mt-4">
        <View className="flex-row gap-2">
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
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setIndex(nextIndex);
        }}
        renderItem={({ item, index: slideIndex }) => {
          const accent = slideAccents[slideIndex % slideAccents.length];
          return (
            <View style={{ width }} className="px-6 py-10">
              <Animated.View
                entering={FadeInUp.duration(450)}
                className="rounded-[36px] border border-app-border/50 dark:border-app-border-dark/50 bg-app-card dark:bg-app-card-dark p-8 overflow-hidden min-h-[320px] justify-between"
              >
                <View
                  className="absolute -top-24 -right-12 w-44 h-44 rounded-full"
                  style={{ backgroundColor: accent, opacity: 0.18 }}
                />
                <View
                  className="absolute -bottom-24 -left-14 w-52 h-52 rounded-full"
                  style={{ backgroundColor: accent, opacity: 0.12 }}
                />
                <View className="w-12 h-12 rounded-2xl items-center justify-center mb-6" style={{ backgroundColor: accent }}>
                  <Feather name={item.icon as any} size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-sm uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-2">
                    {item.title}
                  </Text>
                  <Text className="text-3xl font-display text-app-text dark:text-app-text-dark mb-3">
                    {item.value}
                  </Text>
                  <Text className="text-base text-app-muted dark:text-app-muted-dark">
                    {item.description}
                  </Text>
                </View>
              </Animated.View>
            </View>
          );
        }}
      />

      <View className="px-6 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            {slides.map((slide, dotIndex) => (
              <View
                key={slide.id}
                className="h-2 rounded-full"
                style={{
                  width: dotIndex === index ? 18 : 8,
                  backgroundColor: dotIndex === index ? '#0A9396' : isDark ? '#2B2F36' : '#D1DDE6',
                }}
              />
            ))}
          </View>
          <PressableScale onPress={() => navigation.goBack()}>
            <Text className="text-sm text-app-muted dark:text-app-muted-dark">Close</Text>
          </PressableScale>
        </View>
        <Button title="Done" onPress={() => navigation.goBack()} variant="secondary" />
      </View>
    </View>
  );
}
