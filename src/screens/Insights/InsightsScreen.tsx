import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View, Dimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import { VictoryPie } from '../../components/charts/victory';
import { TimeSeriesAreaChart } from '../../components/charts/TimeSeriesAreaChart';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { DateRangeSelector } from '../../components/DateRangeSelector';
import { useUIStore } from '../../state/useUIStore';
import {
  getExpenseSeries,
  getIncomeSeries,
  getSpendingByCategory,
  getRegretByCategory,
  getRegretDistribution,
  getLifeCostByCategory,
  getEffectiveHourlyRate,
} from '../../db/repositories/analytics';
import { getFirstTransactionDate } from '../../db/repositories/transactions';
import { getPeriodRange } from '../../utils/period';
import { hasCompletedWrapWeek } from '../../utils/wrap';
import { useSettingsStore } from '../../state/useSettingsStore';
import { PressableScale } from '../../components/PressableScale';
import { formatSigned } from '../../utils/money';

import { useTutorialTarget } from '../../components/tutorial/TutorialProvider';
import { normalizeTimeSeries } from '../../utils/timeSeries';

export default function InsightsScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const axisColor = isDark ? '#8B949E' : '#6B7A8F';
  const { insightsPeriod, setInsightsPeriod } = useUIStore();
  const { hoursPerDay, baseCurrency } = useSettingsStore();
  const [date, setDate] = useState(new Date());

  const { ref: chartRef, onLayout: onChartLayout } = useTutorialTarget('insights_expenses_chart');

  const [expenseRows, setExpenseRows] = useState<{ date_ts: number; total_minor: number }[]>([]);
  const [incomeRows, setIncomeRows] = useState<{ date_ts: number; total_minor: number }[]>([]);
  const [categorySpend, setCategorySpend] = useState<
    Awaited<ReturnType<typeof getSpendingByCategory>>
  >([]);
  const [regretByCategory, setRegretByCategory] = useState<
    Awaited<ReturnType<typeof getRegretByCategory>>
  >([]);
  const [regretDistribution, setRegretDistribution] = useState<
    Awaited<ReturnType<typeof getRegretDistribution>>
  >([]);
  const [lifeCostRows, setLifeCostRows] = useState<
    Awaited<ReturnType<typeof getLifeCostByCategory>>
  >([]);
  const [hourlyRateMinor, setHourlyRateMinor] = useState<number | null>(null);
  const [allTimeStart, setAllTimeStart] = useState<number | null>(null);
  const [canShowWrapped, setCanShowWrapped] = useState(false);
  const chartGranularity = insightsPeriod === 'year' || insightsPeriod === 'all' ? 'month' : 'day';
  const brandColor = isDark ? '#58D5D8' : '#0A9396';

  const chartWidth = Dimensions.get('window').width - 48 - 48; // Screen width - padding (24*2) - card padding (24*2)
  const pieOuterRadius = Math.min(chartWidth, 220) / 2 - 16;
  const pieInnerRadius = Math.max(32, Math.round(pieOuterRadius * 0.55));
  const range = useMemo(() => getPeriodRange(date, insightsPeriod), [date, insightsPeriod]);
  const effectiveRange = useMemo(() => {
    if (insightsPeriod === 'all' && allTimeStart) {
      return { start: allTimeStart, end: range.end };
    }
    return range;
  }, [allTimeStart, insightsPeriod, range]);

  const load = useCallback(async () => {
    setCanShowWrapped(false);

    try {
      const firstTransactionTs = allTimeStart ?? (await getFirstTransactionDate());
      setCanShowWrapped(hasCompletedWrapWeek(firstTransactionTs));

      let start = range.start;
      if (insightsPeriod === 'all' && firstTransactionTs) {
        start = firstTransactionTs;
        if (!allTimeStart) {
          setAllTimeStart(firstTransactionTs);
        }
      }

      const end = range.end;
      const [expenseRows, incomeRows, spendRows, regretRows, distributionRows, lifeRows, hourly] =
        await Promise.all([
          getExpenseSeries({ start, end, granularity: chartGranularity }),
          getIncomeSeries({ start, end, granularity: chartGranularity }),
          getSpendingByCategory(start, end),
          getRegretByCategory(start, end),
          getRegretDistribution(start, end),
          getLifeCostByCategory(start, end),
          getEffectiveHourlyRate(),
        ]);
      setExpenseRows(expenseRows);
      setIncomeRows(incomeRows);
      setCategorySpend(spendRows);
      setRegretByCategory(regretRows);
      setRegretDistribution(distributionRows);
      setLifeCostRows(lifeRows);
      setHourlyRateMinor(hourly.hourly_rate_minor ?? null);
    } catch {
      setCanShowWrapped(false);
    }
  }, [allTimeStart, chartGranularity, insightsPeriod, range.end, range.start]);

  const expenseSeries = useMemo(
    () => normalizeTimeSeries(expenseRows, effectiveRange, chartGranularity),
    [chartGranularity, effectiveRange, expenseRows],
  );
  const incomeSeries = useMemo(
    () => normalizeTimeSeries(incomeRows, effectiveRange, chartGranularity),
    [chartGranularity, effectiveRange, incomeRows],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const lifeCostDisplay = useMemo(() => {
    if (!hourlyRateMinor) return [] as { name: string; days: number }[];
    return lifeCostRows
      .map((row) => ({
        name: row.category_name,
        days: row.total_minor / hourlyRateMinor / hoursPerDay,
      }))
      .sort((a, b) => b.days - a.days);
  }, [hoursPerDay, lifeCostRows, hourlyRateMinor]);

  const maxLifeCostDays = lifeCostDisplay[0]?.days ?? 0;

  const pieData = useMemo(() => {
    const palette = [
      '#0A9396',
      '#EE9B00',
      '#38B000',
      '#005F73',
      '#FFB703',
      '#D62828',
      '#6B7A8F',
      '#58D5D8',
    ];
    return categorySpend
      .filter((row) => row.total_minor > 0)
      .map((row, index) => ({
        x: row.category_name,
        y: row.total_minor / 100,
        color: row.category_color || palette[index % palette.length],
      }));
  }, [categorySpend]);

  const totalSpending = useMemo(() => pieData.reduce((sum, row) => sum + row.y, 0), [pieData]);

  const spendingLegend = useMemo(() => {
    const sorted = [...pieData].sort((a, b) => b.y - a.y);
    const visible = sorted.slice(0, 5);
    const otherTotal = sorted.slice(5).reduce((sum, row) => sum + row.y, 0);
    if (otherTotal > 0) {
      visible.push({ x: 'Other', y: otherTotal, color: '#6B7A8F' });
    }
    return visible;
  }, [pieData]);

  const regretBuckets = useMemo(
    () => [
      {
        id: 'total_regret',
        label: 'Total regret',
        color: isDark ? '#FF6B6B' : '#F05A5A',
      },
      {
        id: 'mostly_regret',
        label: 'Mostly regret',
        color: isDark ? '#FF9F6B' : '#F59E6B',
      },
      {
        id: 'mixed',
        label: 'Mixed feelings',
        color: isDark ? '#FFD166' : '#F6C35B',
      },
      {
        id: 'worth_it',
        label: 'Worth it',
        color: isDark ? '#7BD389' : '#7BC87B',
      },
      {
        id: 'absolutely_worth_it',
        label: 'Absolutely worth it',
        color: isDark ? '#4CC9F0' : '#4DB6F5',
      },
    ],
    [isDark],
  );

  const regretCounts = useMemo(() => {
    const map = new Map(regretDistribution.map((row) => [row.bucket, row.count]));
    return regretBuckets.map((bucket) => ({
      ...bucket,
      count: map.get(bucket.id) ?? 0,
    }));
  }, [regretBuckets, regretDistribution]);

  const regretTotal = useMemo(
    () => regretCounts.reduce((sum, bucket) => sum + bucket.count, 0),
    [regretCounts],
  );

  const topRegret = useMemo(() => {
    return regretByCategory
      .filter((row) => row.avg_regret != null)
      .sort((a, b) => (a.avg_regret ?? 0) - (b.avg_regret ?? 0))
      .slice(0, 5);
  }, [regretByCategory]);

  const topWorth = useMemo(() => {
    return regretByCategory
      .filter((row) => row.avg_regret != null)
      .sort((a, b) => (b.avg_regret ?? 0) - (a.avg_regret ?? 0))
      .slice(0, 5);
  }, [regretByCategory]);

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-4xl font-display text-app-text dark:text-app-text-dark">
            Insights
          </Text>
        </View>

        {canShowWrapped ? (
          <PressableScale
            onPress={() => navigation.navigate('Wrapped', { period: 'week' })}
            className="mb-6"
          >
            <View className="rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 bg-app-card dark:bg-app-card-dark p-6 overflow-hidden">
              <View className="absolute -top-10 -right-8 w-28 h-28 rounded-full bg-app-brand/20 dark:bg-app-brand-dark/20" />
              <View className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-app-soft dark:bg-app-soft-dark" />
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 rounded-2xl bg-app-brand dark:bg-app-brand-dark items-center justify-center">
                    <Feather name="star" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text className="text-base font-display text-app-text dark:text-app-text-dark">
                      Worthy Wrapped
                    </Text>
                    <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-1">
                      Your money story, told in playful slides.
                    </Text>
                  </View>
                </View>
                <View className="items-center">
                  <Feather name="chevron-right" size={18} color={brandColor} />
                  <Text className="text-[10px] uppercase tracking-widest text-app-muted dark:text-app-muted-dark mt-2">
                    Open
                  </Text>
                </View>
              </View>
            </View>
          </PressableScale>
        ) : null}

        <DateRangeSelector
          period={insightsPeriod}
          date={date}
          onChangeDate={setDate}
          onChangePeriod={setInsightsPeriod}
        />

        <Animated.View entering={FadeInUp.duration(300)}>
          <View
            className="mb-6 bg-app-card dark:bg-app-card-dark p-6 rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 shadow-sm"
            ref={chartRef}
            onLayout={onChartLayout}
            collapsable={false}
          >
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mr-3">
                <Feather name="trending-up" size={20} color="#D62828" />
              </View>
              <Text className="text-lg font-display text-app-text dark:text-app-text-dark">
                Expenses over time
              </Text>
            </View>
            <TimeSeriesAreaChart
              points={expenseSeries}
              width={chartWidth}
              accent="#D62828"
              axisColor={axisColor}
              currency={baseCurrency}
              granularity={chartGranularity}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(350)}>
          <View className="mb-6 bg-app-card dark:bg-app-card-dark p-6 rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 shadow-sm">
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mr-3">
                <Feather name="trending-down" size={20} color="#38B000" />
              </View>
              <Text className="text-lg font-display text-app-text dark:text-app-text-dark">
                Income over time
              </Text>
            </View>
            <TimeSeriesAreaChart
              points={incomeSeries}
              width={chartWidth}
              accent="#38B000"
              axisColor={axisColor}
              currency={baseCurrency}
              granularity={chartGranularity}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400)}>
          <View className="mb-6 bg-app-card dark:bg-app-card-dark p-6 rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 shadow-sm">
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center mr-3">
                <Feather name="pie-chart" size={20} color={isDark ? '#8B949E' : '#6B7A8F'} />
              </View>
              <Text className="text-lg font-display text-app-text dark:text-app-text-dark">
                Spending by category
              </Text>
            </View>
            {pieData.length === 0 ? (
              <Text className="text-sm text-app-muted dark:text-app-muted-dark">
                No data available
              </Text>
            ) : (
              <>
                <View className="relative items-center">
                  <VictoryPie
                    width={chartWidth}
                    height={200}
                    data={pieData}
                    colorScale={pieData.map((row) => row.color)}
                    padding={20}
                    innerRadius={pieInnerRadius}
                    padAngle={1}
                    labels={() => ''}
                    style={{
                      data: {
                        fillOpacity: 0.9,
                        stroke: isDark ? '#1C2432' : '#FFFFFF',
                        strokeWidth: 1,
                      },
                    }}
                    animate={{ duration: 500 }}
                  />
                  <View
                    pointerEvents="none"
                    className="absolute items-center justify-center"
                    style={{ width: chartWidth, height: 200 }}
                  >
                    <Text className="text-xl font-display text-app-text dark:text-app-text-dark">
                      {formatSigned(totalSpending, baseCurrency)}
                    </Text>
                    <Text className="text-[10px] uppercase tracking-widest text-app-muted dark:text-app-muted-dark mt-1">
                      Total spent
                    </Text>
                  </View>
                </View>
                <View className="mt-2">
                  {spendingLegend.map((row) => (
                    <View key={row.x} className="flex-row items-center justify-between mb-2">
                      <View className="flex-1 flex-row items-center mr-3">
                        <View
                          className="w-2.5 h-2.5 rounded-full mr-2"
                          style={{ backgroundColor: row.color }}
                        />
                        <Text
                          numberOfLines={1}
                          className="text-sm text-app-text dark:text-app-text-dark"
                        >
                          {row.x}
                        </Text>
                      </View>
                      <Text className="text-xs font-medium text-app-muted dark:text-app-muted-dark">
                        {formatSigned(row.y, baseCurrency)} ·{' '}
                        {Math.round((row.y / totalSpending) * 100)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(450)}>
          <View className="mb-6 bg-app-card dark:bg-app-card-dark p-6 rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 shadow-sm">
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center mr-3">
                <Feather name="sliders" size={20} color={isDark ? '#8B949E' : '#6B7A8F'} />
              </View>
              <Text className="text-lg font-display text-app-text dark:text-app-text-dark">
                Regret vs Worth-it
              </Text>
            </View>
            {regretTotal === 0 ? (
              <Text className="text-sm text-app-muted dark:text-app-muted-dark">
                No data available
              </Text>
            ) : (
              <View>
                <View className="h-9 flex-row overflow-hidden rounded-full bg-app-soft dark:bg-app-soft-dark">
                  {regretCounts
                    .filter((bucket) => bucket.count > 0)
                    .map((bucket) => (
                      <View
                        key={bucket.id}
                        style={{
                          width: `${(bucket.count / regretTotal) * 100}%`,
                          backgroundColor: bucket.color,
                        }}
                      />
                    ))}
                </View>
                <View className="flex-row flex-wrap mt-4">
                  {regretCounts
                    .filter((bucket) => bucket.count > 0)
                    .map((bucket) => (
                      <View key={bucket.id} className="w-1/2 flex-row items-center mb-3 pr-2">
                        <View
                          className="w-2.5 h-2.5 rounded-full mr-2"
                          style={{ backgroundColor: bucket.color }}
                        />
                        <View className="flex-1">
                          <Text
                            numberOfLines={1}
                            className="text-xs text-app-text dark:text-app-text-dark"
                          >
                            {bucket.label}
                          </Text>
                          <Text className="text-[10px] text-app-muted dark:text-app-muted-dark mt-0.5">
                            {Math.round((bucket.count / regretTotal) * 100)}% · {bucket.count}
                          </Text>
                        </View>
                      </View>
                    ))}
                </View>
              </View>
            )}
            <View className="mt-6">
              <View className="flex-row items-start">
                <View className="flex-1 pr-3">
                  <Text className="text-xs uppercase tracking-wider text-app-muted dark:text-app-muted-dark mb-3">
                    Most regret
                  </Text>
                  {topRegret.length === 0 ? (
                    <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                      No sentiment data
                    </Text>
                  ) : (
                    <View className="flex-col gap-2">
                      {topRegret.map((row) => (
                        <View
                          key={row.category_id}
                          className="flex-row items-center justify-between"
                        >
                          <Text className="text-sm text-app-text dark:text-app-text-dark">
                            {row.category_name}
                          </Text>
                          <View className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                            <Text className="text-xs font-bold text-red-600 dark:text-red-400">
                              {Math.round(row.avg_regret ?? 0)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <View className="w-px bg-app-border/60 dark:bg-app-border-dark/60" />
                <View className="flex-1 pl-3">
                  <Text className="text-xs uppercase tracking-wider text-app-muted dark:text-app-muted-dark mb-3">
                    Most worth it
                  </Text>
                  {topWorth.length === 0 ? (
                    <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                      No sentiment data
                    </Text>
                  ) : (
                    <View className="flex-col gap-2">
                      {topWorth.map((row) => (
                        <View
                          key={row.category_id}
                          className="flex-row items-center justify-between"
                        >
                          <Text className="text-sm text-app-text dark:text-app-text-dark">
                            {row.category_name}
                          </Text>
                          <View className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                            <Text className="text-xs font-bold text-green-600 dark:text-green-400">
                              {Math.round(row.avg_regret ?? 0)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500)}>
          <View className="mb-6 bg-app-card dark:bg-app-card-dark p-6 rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 shadow-sm">
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center mr-3">
                <Feather name="clock" size={20} color={isDark ? '#8B949E' : '#6B7A8F'} />
              </View>
              <Text className="text-lg font-display text-app-text dark:text-app-text-dark">
                Life cost by category
              </Text>
            </View>
            {hourlyRateMinor ? (
              <View>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
                    Time represented by spending
                  </Text>
                  <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                    {lifeCostDisplay.length} categories
                  </Text>
                </View>
                {lifeCostDisplay.map((row) => (
                  <View key={row.name} className="mb-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-app-text dark:text-app-text-dark">
                        {row.name}
                      </Text>
                      <View className="flex-row items-baseline">
                        <Text className="text-base font-bold text-app-brand dark:text-app-brand-dark">
                          {row.days.toFixed(1)}
                        </Text>
                        <Text className="text-xs text-app-muted dark:text-app-muted-dark ml-1">
                          days
                        </Text>
                      </View>
                    </View>
                    <View className="h-2 rounded-full bg-app-soft dark:bg-app-soft-dark overflow-hidden">
                      <View
                        className="h-full rounded-full bg-app-brand dark:bg-app-brand-dark"
                        style={{ width: `${(row.days / maxLifeCostDays) * 100}%` }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-app-muted dark:text-app-muted-dark">
                Add income with hours worked to unlock life cost analytics.
              </Text>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
