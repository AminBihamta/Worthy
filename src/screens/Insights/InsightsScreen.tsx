import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View, Dimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import {
  addDays,
  addMonths,
  differenceInDays,
  differenceInMonths,
  format,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import {
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryPie,
} from '../../components/charts/victory';
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
import { useSettingsStore } from '../../state/useSettingsStore';
import { PressableScale } from '../../components/PressableScale';

import { useTutorialTarget } from '../../components/tutorial/TutorialProvider';

export default function InsightsScreen() {
  const navigation = useNavigation<any>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const axisColor = isDark ? '#8B949E' : '#6B7A8F';
  const { insightsPeriod, setInsightsPeriod } = useUIStore();
  const { hoursPerDay } = useSettingsStore();
  const [date, setDate] = useState(new Date());

  const { ref: chartRef, onLayout: onChartLayout } = useTutorialTarget('insights_expenses_chart');

  const [expenseSeries, setExpenseSeries] = useState<{ x: number; y: number }[]>([]);
  const [incomeSeries, setIncomeSeries] = useState<{ x: number; y: number }[]>([]);
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

  const parseBucketDate = useCallback(
    (bucket: string) => {
      const parts = bucket.split('-').map((value) => Number(value));
      if (chartGranularity === 'month') {
        const [year, month] = parts;
        return new Date(year, month - 1, 1).getTime();
      }
      const [year, month, day] = parts;
      return new Date(year, month - 1, day).getTime();
    },
    [chartGranularity],
  );

  const load = useCallback(async () => {
    let start = range.start;
    if (insightsPeriod === 'all') {
      const firstDate = allTimeStart ?? (await getFirstTransactionDate());
      if (firstDate) {
        start = firstDate;
        if (!allTimeStart) {
          setAllTimeStart(firstDate);
        }
      }
    }
    const end = range.end;
    const [
      expenseRows,
      incomeRows,
      spendRows,
      regretRows,
      distributionRows,
      lifeRows,
      hourly,
    ] = await Promise.all([
      getExpenseSeries({ start, end, granularity: chartGranularity }),
      getIncomeSeries({ start, end, granularity: chartGranularity }),
      getSpendingByCategory(start, end),
      getRegretByCategory(start, end),
      getRegretDistribution(start, end),
      getLifeCostByCategory(start, end),
      getEffectiveHourlyRate(),
    ]);
    const nextExpense = expenseRows
      .map((row) => ({ x: parseBucketDate(row.bucket), y: row.total_minor / 100 }))
      .sort((a, b) => a.x - b.x);
    const nextIncome = incomeRows
      .map((row) => ({ x: parseBucketDate(row.bucket), y: row.total_minor / 100 }))
      .sort((a, b) => a.x - b.x);
    setExpenseSeries(nextExpense);
    setIncomeSeries(nextIncome);
    setCategorySpend(spendRows);
    setRegretByCategory(regretRows);
    setRegretDistribution(distributionRows);
    setLifeCostRows(lifeRows);
    setHourlyRateMinor(hourly.hourly_rate_minor ?? null);
  }, [allTimeStart, chartGranularity, insightsPeriod, parseBucketDate, range.end, range.start]);

  const buildTickValues = useCallback((start: number, end: number, period: string) => {
    const isYear = period === 'year' || period === 'all';
    const alignedStart = isYear ? startOfMonth(start) : startOfDay(start);
    const alignedEnd = isYear ? startOfMonth(end) : startOfDay(end);

    if (isYear) {
      const months = differenceInMonths(alignedEnd, alignedStart);
      if (months <= 0) return [alignedStart.getTime()];
      const step = Math.max(1, Math.ceil(months / 5));
      const ticks: Date[] = [];
      for (let i = 0; i <= months; i += step) {
        ticks.push(addMonths(alignedStart, i));
      }
      if (ticks[ticks.length - 1]?.getTime() !== alignedEnd.getTime()) {
        ticks.push(alignedEnd);
      }
      return ticks.map((value) => value.getTime());
    }

    const days = differenceInDays(alignedEnd, alignedStart);
    if (days <= 0) return [alignedStart.getTime()];
    const targetTicks = period === 'week' ? 4 : 5;
    const step = Math.max(1, Math.ceil(days / (targetTicks - 1)));
    const ticks: Date[] = [];
    for (let i = 0; i <= days; i += step) {
      ticks.push(addDays(alignedStart, i));
    }
    if (ticks[ticks.length - 1]?.getTime() !== alignedEnd.getTime()) {
      ticks.push(alignedEnd);
    }
    return ticks.map((value) => value.getTime());
  }, []);

  const chartRange = useMemo(() => {
    if (insightsPeriod !== 'all') {
      return effectiveRange;
    }
    const points = [...expenseSeries, ...incomeSeries].map((row) => row.x);
    if (!points.length) {
      return effectiveRange;
    }
    const min = Math.min(...points);
    const max = Math.max(...points);
    return { start: min, end: max };
  }, [effectiveRange, expenseSeries, incomeSeries, insightsPeriod]);

  const timeTicks = useMemo(
    () => buildTickValues(chartRange.start, chartRange.end, insightsPeriod),
    [buildTickValues, chartRange.end, chartRange.start, insightsPeriod],
  );

  const formatTickLabel = useCallback(
    (value: number) => {
      const dateValue = new Date(value);
      if (insightsPeriod === 'all') return format(dateValue, 'MMM yyyy');
      if (insightsPeriod === 'year') return format(dateValue, 'MMM');
      if (insightsPeriod === 'week') return format(dateValue, 'EEE d');
      return format(dateValue, 'MMM d');
    },
    [insightsPeriod],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const lifeCostDisplay = useMemo(() => {
    if (!hourlyRateMinor) return [] as { name: string; hours: number }[];
    return lifeCostRows.map((row) => ({
      name: row.category_name,
      hours: row.total_minor / hourlyRateMinor,
    }));
  }, [lifeCostRows, hourlyRateMinor]);

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

  const regretPieData = useMemo(
    () =>
      regretCounts
        .map((bucket) => ({
          x: bucket.label,
          y: bucket.count,
          color: bucket.color,
          percentage: regretTotal ? (bucket.count / regretTotal) * 100 : 0,
        }))
        .filter((bucket) => bucket.y > 0),
    [regretCounts, regretTotal],
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
            {expenseSeries.length === 0 ? (
              <Text className="text-sm text-app-muted dark:text-app-muted-dark">
                No data available
              </Text>
            ) : (
              <VictoryChart
                width={chartWidth}
                height={220}
                padding={{ top: 20, left: 40, right: 20, bottom: 40 }}
                prependDefaultAxes={false}
                scale={{ x: 'time' }}
                domain={{ x: [chartRange.start, chartRange.end] }}
              >
                <VictoryAxis
                  tickValues={timeTicks}
                  tickFormat={formatTickLabel}
                  fixLabelOverlap
                  style={{
                    tickLabels: {
                      fontSize: 10,
                      fill: axisColor,
                      fontFamily: 'Manrope_500Medium',
                    },
                    axis: { stroke: axisColor, strokeWidth: 0.5 },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    tickLabels: {
                      fontSize: 10,
                      fill: axisColor,
                      fontFamily: 'Manrope_500Medium',
                    },
                    axis: { stroke: 'transparent' },
                    grid: { stroke: axisColor, strokeWidth: 0.5, strokeDasharray: '4, 4' },
                  }}
                />
                <VictoryLine
                  data={expenseSeries}
                  style={{
                    data: { stroke: '#D62828', strokeWidth: 3 },
                  }}
                  animate={{
                    duration: 500,
                    onLoad: { duration: 500 },
                  }}
                />
              </VictoryChart>
            )}
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
            {incomeSeries.length === 0 ? (
              <Text className="text-sm text-app-muted dark:text-app-muted-dark">
                No data available
              </Text>
            ) : (
              <VictoryChart
                width={chartWidth}
                height={220}
                padding={{ top: 20, left: 40, right: 20, bottom: 40 }}
                prependDefaultAxes={false}
                scale={{ x: 'time' }}
                domain={{ x: [chartRange.start, chartRange.end] }}
              >
                <VictoryAxis
                  tickValues={timeTicks}
                  tickFormat={formatTickLabel}
                  fixLabelOverlap
                  style={{
                    tickLabels: {
                      fontSize: 10,
                      fill: axisColor,
                      fontFamily: 'Manrope_500Medium',
                    },
                    axis: { stroke: axisColor, strokeWidth: 0.5 },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    tickLabels: {
                      fontSize: 10,
                      fill: axisColor,
                      fontFamily: 'Manrope_500Medium',
                    },
                    axis: { stroke: 'transparent' },
                    grid: { stroke: axisColor, strokeWidth: 0.5, strokeDasharray: '4, 4' },
                  }}
                />
                <VictoryLine
                  data={incomeSeries}
                  style={{
                    data: { stroke: '#38B000', strokeWidth: 3 },
                  }}
                  animate={{
                    duration: 500,
                    onLoad: { duration: 500 },
                  }}
                />
              </VictoryChart>
            )}
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
              <VictoryPie
                width={chartWidth}
                height={200}
                data={pieData}
                colorScale={pieData.map((row) => row.color)}
                padding={20}
                innerRadius={pieInnerRadius}
                padAngle={1}
                labelRadius={90}
                style={{
                  data: {
                    fillOpacity: 0.9,
                    stroke: isDark ? '#1C2432' : '#FFFFFF',
                    strokeWidth: 1,
                  },
                  labels: { fontSize: 10, fill: axisColor, fontFamily: 'Manrope_500Medium' },
                }}
                animate={{
                  duration: 500,
                }}
              />
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
              <VictoryPie
                width={chartWidth}
                height={200}
                data={regretPieData}
                colorScale={regretPieData.map((row) => row.color)}
                padding={20}
                innerRadius={pieInnerRadius}
                padAngle={1}
                labelRadius={pieInnerRadius + 28}
                labels={({ datum }) =>
                  datum.percentage ? `${Math.round(datum.percentage)}%` : ''
                }
                style={{
                  data: {
                    fillOpacity: 0.92,
                    stroke: isDark ? '#1C2432' : '#FFFFFF',
                    strokeWidth: 1,
                  },
                  labels: { fontSize: 10, fill: axisColor, fontFamily: 'Manrope_500Medium' },
                }}
                animate={{
                  duration: 500,
                }}
              />
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
              lifeCostDisplay.map((row) => (
                <View key={row.name} className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm font-medium text-app-text dark:text-app-text-dark">
                    {row.name}
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-sm font-bold text-app-brand dark:text-app-brand-dark mr-1">
                      {(row.hours / hoursPerDay).toFixed(1)}
                    </Text>
                    <Text className="text-xs text-app-muted dark:text-app-muted-dark">days</Text>
                  </View>
                </View>
              ))
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
