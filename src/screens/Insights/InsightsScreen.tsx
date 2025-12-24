import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLine, VictoryPie } from 'victory-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Card } from '../../components/Card';
import { SegmentedControl } from '../../components/SegmentedControl';
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

export default function InsightsScreen() {
  const { insightsPeriod, setInsightsPeriod } = useUIStore();
  const { fixedHourlyRateMinor, hoursPerDay } = useSettingsStore();
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

  const load = useCallback(() => {
    const range = getPeriodRange(new Date(), insightsPeriod);
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
  }, [insightsPeriod, fixedHourlyRateMinor]);

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

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 24 }}
    >
      <View className="mb-6">
        <SegmentedControl
          options={[
            { label: 'Week', value: 'week' },
            { label: 'Month', value: 'month' },
            { label: 'Year', value: 'year' },
          ]}
          value={insightsPeriod}
          onChange={(value) => setInsightsPeriod(value)}
        />
      </View>

      <Animated.View entering={FadeInUp.duration(300)}>
        <Card className="mb-5">
          <Text className="text-base font-display text-app-text dark:text-app-text-dark mb-3">
            Expenses over time
          </Text>
          <VictoryChart height={220} padding={{ top: 20, left: 40, right: 20, bottom: 40 }}>
            <VictoryAxis style={{ tickLabels: { fontSize: 10, fill: '#8D929B' } }} />
            <VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 10, fill: '#8D929B' } }} />
            <VictoryLine
              data={expenseSeries}
              style={{ data: { stroke: '#EF4444', strokeWidth: 2 } }}
            />
          </VictoryChart>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350)}>
        <Card className="mb-5">
          <Text className="text-base font-display text-app-text dark:text-app-text-dark mb-3">
            Income over time
          </Text>
          <VictoryChart height={220} padding={{ top: 20, left: 40, right: 20, bottom: 40 }}>
            <VictoryAxis style={{ tickLabels: { fontSize: 10, fill: '#8D929B' } }} />
            <VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 10, fill: '#8D929B' } }} />
            <VictoryLine
              data={incomeSeries}
              style={{ data: { stroke: '#2CB67D', strokeWidth: 2 } }}
            />
          </VictoryChart>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(400)}>
        <Card className="mb-5">
          <Text className="text-base font-display text-app-text dark:text-app-text-dark mb-3">
            Spending by category
          </Text>
          {categorySpend.length === 0 ? (
            <Text className="text-sm text-app-muted dark:text-app-muted-dark">No data yet.</Text>
          ) : (
            <VictoryPie
              height={220}
              data={categorySpend.map((row) => ({
                x: row.category_name,
                y: row.total_minor / 100,
              }))}
              colorScale={categorySpend.map((row) => row.category_color)}
              innerRadius={60}
              labelRadius={90}
              style={{ labels: { fontSize: 10, fill: '#8D929B' } }}
            />
          )}
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(450)}>
        <Card className="mb-5">
          <Text className="text-base font-display text-app-text dark:text-app-text-dark mb-3">
            Regret vs worth-it
          </Text>
          {regretByCategory.length === 0 ? (
            <Text className="text-sm text-app-muted dark:text-app-muted-dark">
              No slider data yet.
            </Text>
          ) : (
            <VictoryChart height={220} padding={{ top: 20, left: 40, right: 20, bottom: 40 }}>
              <VictoryAxis style={{ tickLabels: { fontSize: 10, fill: '#8D929B' } }} />
              <VictoryAxis
                dependentAxis
                domain={[0, 100]}
                style={{ tickLabels: { fontSize: 10, fill: '#8D929B' } }}
              />
              <VictoryBar
                data={regretByCategory.map((row) => ({ x: row.category_name, y: row.avg_regret }))}
                style={{ data: { fill: '#FFB347' } }}
              />
            </VictoryChart>
          )}
          <View className="mt-4">
            {regretful.map((item) => (
              <Text key={item.title} className="text-xs text-app-muted dark:text-app-muted-dark">
                {item.title}: avg {Math.round(item.avg_regret)}
              </Text>
            ))}
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500)}>
        <Card>
          <Text className="text-base font-display text-app-text dark:text-app-text-dark mb-3">
            Life cost by category
          </Text>
          {hourlyRateMinor ? (
            lifeCostDisplay.map((row) => (
              <View key={row.name} className="flex-row items-center justify-between mb-2">
                <Text className="text-sm text-app-text dark:text-app-text-dark">{row.name}</Text>
                <Text className="text-sm text-app-muted dark:text-app-muted-dark">
                  {(row.hours / hoursPerDay).toFixed(1)} days
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-sm text-app-muted dark:text-app-muted-dark">
              Set a fixed hourly rate in Settings to unlock life cost analytics.
            </Text>
          )}
        </Card>
      </Animated.View>
    </ScrollView>
  );
}
