import React, { useMemo, useState } from 'react';
import { GestureResponderEvent, Text, View } from 'react-native';
import { format } from 'date-fns';
import { VictoryAxis, VictoryChart, VictoryLine } from './victory';
import type { NormalizedTimeSeriesPoint, SeriesGranularity } from '../../utils/timeSeries';

type Props = {
  points: NormalizedTimeSeriesPoint[];
  width: number;
  accent: string;
  axisColor: string;
  currency: string;
  granularity: SeriesGranularity;
};

const compactAmount = (value: number, currency: string) => {
  const absolute = Math.abs(value);
  if (absolute >= 1000000) return `${currency} ${(value / 1000000).toFixed(1)}m`;
  if (absolute >= 1000) return `${currency} ${(value / 1000).toFixed(1)}k`;
  return `${currency} ${Math.round(value)}`;
};

const exactAmount = (value: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);

const chartHeight = 290;
const chartPadding = { top: 20, left: 72, right: 20, bottom: 52 };
const scrubberSize = 18;

export function TimeSeriesAreaChart({
  points,
  width,
  accent,
  axisColor,
  currency,
  granularity,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const tickValues = useMemo(() => {
    if (points.length <= 1) return points.map((point) => point.x);
    const count = granularity === 'month' ? 5 : points.length <= 10 ? 5 : 6;
    const step = Math.max(1, Math.ceil((points.length - 1) / (count - 1)));
    const indexes = Array.from({ length: points.length }, (_, index) => index).filter(
      (index) => index % step === 0 || index === points.length - 1,
    );
    return indexes.map((index) => points[index].x);
  }, [granularity, points]);

  const domain = useMemo(() => {
    const max = Math.max(...points.map((point) => point.y), 0);
    return {
      x: [points[0]?.x ?? 0, points[points.length - 1]?.x ?? 1] as [number, number],
      y: [0, max > 0 ? max * 1.15 : 1] as [number, number],
    };
  }, [points]);

  const plotPoints = useMemo(() => points.map(({ x, y }) => ({ x, y })), [points]);
  const latestDataPoint = useMemo(
    () => [...points].reverse().find((point) => point.hasData) ?? points[points.length - 1] ?? null,
    [points],
  );
  const selectedPoint = selectedIndex == null ? latestDataPoint : (points[selectedIndex] ?? null);
  const activeIndex = selectedIndex ?? points.indexOf(latestDataPoint as NormalizedTimeSeriesPoint);
  const plotWidth = Math.max(1, width - chartPadding.left - chartPadding.right);
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const domainMaximum = domain.y[1];
  const scrubberLeft =
    chartPadding.left + (Math.max(0, activeIndex) / Math.max(1, points.length - 1)) * plotWidth;
  const scrubberTop =
    chartPadding.top + (1 - Math.min(1, (selectedPoint?.y ?? 0) / domainMaximum)) * plotHeight;

  const selectClosestPoint = (event: GestureResponderEvent) => {
    const progress = Math.max(
      0,
      Math.min(1, (event.nativeEvent.locationX - chartPadding.left) / plotWidth),
    );
    setSelectedIndex(Math.round(progress * (points.length - 1)));
  };

  if (!points.some((point) => point.hasData)) {
    return (
      <Text className="text-sm text-app-muted dark:text-app-muted-dark">No data available</Text>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={`${granularity === 'month' ? 'Monthly' : 'Daily'} ${currency} chart`}
    >
      <View className="mb-2 min-h-6 items-center justify-center">
        {selectedPoint ? (
          <Text className="text-xs font-medium text-app-text dark:text-app-text-dark">
            {selectedIndex == null ? 'Latest activity' : 'Selected'} · {selectedPoint.label} ·{' '}
            {exactAmount(selectedPoint.y, currency)}
          </Text>
        ) : null}
      </View>
      <View
        className="relative"
        style={{ height: chartHeight }}
        accessible
        accessibilityLabel="Drag the chart handle to inspect a date and amount"
        accessibilityHint="The displayed date and amount update while you drag"
      >
        <VictoryChart
          width={width}
          height={chartHeight}
          padding={chartPadding}
          domain={domain}
          scale={{ x: 'time' }}
        >
          <VictoryAxis
            tickValues={tickValues}
            tickFormat={(value) => {
              const date = new Date(value);
              return granularity === 'month' ? format(date, 'MMM yy') : format(date, 'MMM d');
            }}
            style={{
              axis: { stroke: axisColor, strokeWidth: 0.6 },
              tickLabels: { fontSize: 10, fill: axisColor, fontFamily: 'Manrope_500Medium' },
              ticks: { stroke: axisColor, size: 4 },
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(value) => compactAmount(Number(value), currency)}
            style={{
              axis: { stroke: 'transparent' },
              grid: { stroke: axisColor, strokeWidth: 0.5, strokeDasharray: '4, 5', opacity: 0.5 },
              tickLabels: { fontSize: 10, fill: axisColor, fontFamily: 'Manrope_500Medium' },
              ticks: { stroke: 'transparent' },
            }}
          />
          <VictoryLine
            data={plotPoints}
            interpolation="monotoneX"
            style={{ data: { stroke: accent, strokeWidth: 3, strokeLinecap: 'round' } }}
          />
        </VictoryChart>
        <View
          className="absolute inset-0"
          onStartShouldSetResponderCapture={() => true}
          onMoveShouldSetResponderCapture={() => true}
          onResponderMove={selectClosestPoint}
          onResponderRelease={selectClosestPoint}
          accessibilityRole="adjustable"
          accessibilityValue={{
            text: selectedPoint
              ? `${selectedPoint.label}, ${exactAmount(selectedPoint.y, currency)}`
              : '',
          }}
        />
        {selectedPoint ? (
          <View
            pointerEvents="none"
            className="absolute"
            style={{
              left: scrubberLeft - scrubberSize / 2,
              top: scrubberTop - scrubberSize / 2,
              width: scrubberSize,
              height: scrubberSize,
              borderRadius: scrubberSize / 2,
              backgroundColor: accent,
              borderWidth: 3,
              borderColor: '#FFFFFF',
              elevation: 3,
              shadowColor: '#0F172A',
              shadowOpacity: 0.2,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
            }}
          />
        ) : null}
        <View
          pointerEvents="none"
          className="absolute"
          style={{
            left: scrubberLeft,
            top: chartPadding.top,
            width: 1,
            height: Math.max(0, scrubberTop - chartPadding.top),
            backgroundColor: accent,
            opacity: 0.35,
          }}
        />
      </View>
    </View>
  );
}
