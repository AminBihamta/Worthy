import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  VictoryAxis,
  VictoryBar,
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
  getMostRegretfulExpenses,
  getLifeCostByCategory,
  getEffectiveHourlyRate,
} from '../../db/repositories/analytics';
import { getPeriodRange } from '../../utils/period';
import { useSettingsStore } from '../../state/useSettingsStore';
import { formatSigned } from '../../utils/money';

export default function InsightsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const axisColor = isDark ? '#8B949E' : '#6B7A8F';
  const accentColor = isDark ? '#FFB703' : '#EE9B00';
  const { insightsPeriod, setInsightsPeriod } = useUIStore();
  const { fixedHourlyRateMinor, hoursPerDay } = useSettingsStore();
  const [date, setDate] = useState(new Date());
  const [expenseSeries, setExpenseSeries] = useState<{ x: string; y: number }[]>([]);
  const [incomeSeries, setIncomeSeries] = useState<{ x: string; y: number }[]>([]);
  const [categorySpend, setCategorySpend] = useState<
    Awaited<ReturnType<typeof getSpendingByCategory>>
  >([]);
  const [regretByCategory, setRegretByCategory] = useState<
    Awaited<ReturnType<typeof getRegretByCategory>>
  >([]);
  const [regretful, setRegretful] = useState<Awaited<ReturnType<typeof getMostRegretfulExpenses>>>(
    [],
  );
  const [lifeCostRows, setLifeCostRows] = useState<
    Awaited<ReturnType<typeof getLifeCostByCategory>>
  >([]);
  const [hourlyRateMinor, setHourlyRateMinor] = useState<number | null>(null);

  const chartWidth = Dimensions.get('window').width - 48 - 48; // Screen width - padding (24*2) - card padding (24*2)
  const pieOuterRadius = Math.min(chartWidth, 220) / 2 - 16;
  const pieInnerRadius = Math.max(32, Math.round(pieOuterRadius * 0.55));

  const load = useCallback(() => {
    const range = getPeriodRange(date, insightsPeriod);
    const granularity = insightsPeriod === 'year' ? 'month' : 'day';
    Promise.all([
      getExpenseSeries({ start: range.start, end: range.end, granularity }),
      getIncomeSeries({ start: range.start, end: range.end, granularity }),
      getSpendingByCategory(range.start, range.end),
      getRegretByCategory(range.start, range.end),
      getMostRegretfulExpenses(range.start, range.end, 5),
      getLifeCostByCategory(range.start, range.end),
      getEffectiveHourlyRate(),
    ]).then(([expenseRows, incomeRows, spendRows, regretRows, regretfulRows, lifeRows, hourly]) => {
      setExpenseSeries(expenseRows.map((row) => ({ x: row.bucket, y: row.total_minor / 100 })));
      setIncomeSeries(incomeRows.map((row) => ({ x: row.bucket, y: row.total_minor / 100 })));
      setCategorySpend(spendRows);
      setRegretByCategory(regretRows);
      setRegretful(regretfulRows);
      setLifeCostRows(lifeRows);
      const fallback = fixedHourlyRateMinor > 0 ? fixedHourlyRateMinor : null;
      setHourlyRateMinor(hourly.hourly_rate_minor ?? fallback);
    });
  }, [insightsPeriod, fixedHourlyRateMinor, date]);

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

        <DateRangeSelector
          period={insightsPeriod}
          date={date}
          onChangeDate={setDate}
          onChangePeriod={setInsightsPeriod}
        />

        <Animated.View entering={FadeInUp.duration(300)}>
          <View className="mb-6 bg-app-card dark:bg-app-card-dark p-6 rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 shadow-sm">
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
              >
                <VictoryAxis
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
              >
                <VictoryAxis
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
            {regretByCategory.length === 0 ? (
              <Text className="text-sm text-app-muted dark:text-app-muted-dark">
                No data available
              </Text>
            ) : (
              <VictoryChart
                width={chartWidth}
                height={220}
                padding={{ top: 20, left: 40, right: 20, bottom: 40 }}
                prependDefaultAxes={false}
                domain={{ y: [0, 100] }}
              >
                <VictoryAxis
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
                <VictoryBar
                  data={regretByCategory.map((row) => ({
                    x: row.category_name,
                    y: row.avg_regret,
                  }))}
                  style={{ data: { fill: accentColor } }}
                  animate={{
                    duration: 500,
                    onLoad: { duration: 500 },
                  }}
                  cornerRadius={{ top: 4 }}

                />
              </VictoryChart>
            )}
            <View className="mt-5">
              {regretful.map((item, index) => (
                <View
                  key={item.title}
                  className={`flex-row items-center justify-between py-2 ${
                    index < regretful.length - 1
                      ? 'border-b border-app-border/50 dark:border-app-border-dark/50'
                      : ''
                  }`}
                >
                  <Text className="text-sm text-app-text dark:text-app-text-dark font-medium">
                    {item.title}
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-xs text-app-muted dark:text-app-muted-dark mr-2">
                      Regret score
                    </Text>
                    <View className="bg-app-soft dark:bg-app-soft-dark px-2 py-1 rounded-lg">
                      <Text className="text-xs font-bold text-app-brand dark:text-app-brand-dark">
                        {Math.round(item.avg_regret)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
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
                Set a fixed hourly rate in Settings to unlock life cost analytics.
              </Text>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
