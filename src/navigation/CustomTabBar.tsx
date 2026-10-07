import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../components/PressableScale';
import { useTutorial } from '../components/tutorial/TutorialProvider';
import { colors } from '../theme/tokens';

const TAB_CONFIG: Record<string, { label: string; icon: keyof typeof Feather.glyphMap }> = {
  HomeStack: { label: 'Home', icon: 'home' },
  TransactionsStack: { label: 'Transactions', icon: 'list' },
  BudgetsStack: { label: 'Budgets', icon: 'pie-chart' },
  InsightsStack: { label: 'Insights', icon: 'bar-chart-2' },
};

const STACK_ROOTS: Record<string, string> = {
  HomeStack: 'Home',
  TransactionsStack: 'Transactions',
  BudgetsStack: 'Budgets',
  InsightsStack: 'Insights',
};

const QUICK_ACTIONS: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  route: string;
  screen: string;
}[] = [
  { label: 'Transfer', icon: 'repeat', color: '#3577C8', route: 'HomeStack', screen: 'AddTransfer' },
  { label: 'Budget', icon: 'pie-chart', color: '#7758B8', route: 'BudgetsStack', screen: 'BudgetForm' },
  { label: 'Income', icon: 'trending-up', color: '#198754', route: 'HomeStack', screen: 'AddIncome' },
  { label: 'Expense', icon: 'file-text', color: '#D92D3F', route: 'HomeStack', screen: 'AddExpense' },
];

function TabBarItem({
  route,
  index,
  state,
  navigation,
  descriptors,
  onNavigate,
}: {
  route: BottomTabBarProps['state']['routes'][number];
  index: number;
  state: BottomTabBarProps['state'];
  navigation: BottomTabBarProps['navigation'];
  descriptors: BottomTabBarProps['descriptors'];
  onNavigate: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const palette = colorScheme === 'dark' ? colors.dark : colors.light;
  const focused = state.index === index;
  const config = TAB_CONFIG[route.name] ?? { label: route.name, icon: 'circle' as const };
  const { options } = descriptors[route.key];
  const label =
    typeof options.tabBarLabel === 'string'
      ? options.tabBarLabel
      : typeof options.title === 'string'
        ? options.title
        : config.label;
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused, progress]);

  const selectedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [palette.surface, colorScheme === 'dark' ? '#174345' : '#D8F2ED'],
    ),
  }));

  const onPress = () => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (event.defaultPrevented) return;
    onNavigate();
    const rootScreen = STACK_ROOTS[route.name];
    navigation.navigate(route.name, rootScreen ? { screen: rootScreen } : undefined);
  };

  return (
    <PressableScale
      haptic
      onPress={onPress}
      onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      className="w-full"
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={[
          { width: '100%', height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
          selectedStyle,
        ]}
      >
        <Feather
          name={config.icon}
          size={22}
          color={focused ? (colorScheme === 'dark' ? '#78D9D4' : '#008182') : palette.muted}
        />
      </Animated.View>
    </PressableScale>
  );
}

function QuickActionButton({
  action,
  index,
  expanded,
  progress,
  width,
  bottom,
  brandColor,
  onPress,
}: {
  action: (typeof QUICK_ACTIONS)[number];
  index: number;
  expanded: boolean;
  progress: SharedValue<number>;
  width: number;
  bottom: number;
  brandColor: string;
  onPress: () => void;
}) {
  const radius = Math.min(104, (width - 64) / 2);
  const angle = ((150 - index * 40) * Math.PI) / 180;
  const offset = radius * Math.cos(angle);
  const lift = radius * Math.sin(angle);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, offset]) },
      { translateY: interpolate(progress.value, [0, 1], [0, -lift]) },
      { scale: interpolate(progress.value, [0, 1], [0.65, 1]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents={expanded ? 'auto' : 'none'}
      style={[
        {
          position: 'absolute',
          left: width / 2 - 27,
          bottom: bottom + 4,
          zIndex: 3,
        },
        animatedStyle,
      ]}
    >
      <PressableScale
        onPress={onPress}
        haptic
        accessibilityRole="button"
        accessibilityLabel={action.label}
        accessibilityHint={`Opens the ${action.label.toLowerCase()} form`}
      >
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: brandColor,
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 3,
          }}
        >
          <Feather name={action.icon} size={23} color="#FFFFFF" />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const progress = useSharedValue(0);
  const plusStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
  }));
  const addButtonRef = useRef<View>(null);
  const { isActive: tutorialActive, registerTarget } = useTutorial();
  const bottom = Math.max(insets.bottom, 8) + 10;
  const dockWidth = width - 32;
  const center = dockWidth / 2;
  const dockPath = `M30 0 H${center - 36} A36 36 0 0 0 ${center + 36} 0 H${dockWidth - 30} Q${dockWidth} 0 ${dockWidth} 30 Q${dockWidth} 60 ${dockWidth - 30} 60 H30 Q0 60 0 30 Q0 0 30 0 Z`;

  const closeMenu = useCallback(() => {
    setExpanded(false);
    progress.value = withTiming(0, { duration: 130, easing: Easing.in(Easing.cubic) });
  }, [progress]);

  const measureTutorialTarget = useCallback(() => {
    if (!tutorialActive) return;
    addButtonRef.current?.measureInWindow((x, y, targetWidth, targetHeight) => {
      if (targetWidth <= 0 || targetHeight <= 0) return;
      const layout = { x, y, width: targetWidth, height: targetHeight };
      registerTarget('home_actions', layout);
      registerTarget('budgets_fab', layout);
    });
  }, [registerTarget, tutorialActive]);

  useEffect(() => {
    measureTutorialTarget();
    const timer = setTimeout(measureTutorialTarget, 500);
    return () => clearTimeout(timer);
  }, [measureTutorialTarget]);

  const toggleMenu = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    progress.value = withTiming(nextExpanded ? 1 : 0, {
      duration: nextExpanded ? 240 : 150,
      easing: nextExpanded ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    });
  };

  const openAction = (action: (typeof QUICK_ACTIONS)[number]) => {
    closeMenu();
    navigation.navigate(action.route, { screen: action.screen });
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {expanded ? (
        <Pressable
          style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
          onPress={closeMenu}
          accessibilityRole="button"
          accessibilityLabel="Dismiss quick actions"
        />
      ) : null}

      {QUICK_ACTIONS.map((action, index) => (
        <QuickActionButton
          key={action.label}
          action={action}
          index={index}
          expanded={expanded}
          progress={progress}
          width={width}
          bottom={bottom + 29}
          brandColor={action.color}
          onPress={() => openAction(action)}
        />
      ))}

      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom,
          zIndex: 2,
          height: 60,
          paddingHorizontal: 8,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.24 : 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 },
        }}
      >
        <Svg pointerEvents="none" width={dockWidth} height={60} style={StyleSheet.absoluteFill}>
          <Path d={dockPath} fill={isDark ? '#2A3035' : '#FFFFFF'} />
        </Svg>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {state.routes.slice(0, 2).map((route, index) => (
            <TabBarItem
              key={route.key}
              route={route}
              index={index}
              state={state}
              navigation={navigation}
              descriptors={descriptors}
              onNavigate={closeMenu}
            />
          ))}
        </View>

        <View style={{ width: 84, height: 60 }} />

        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {state.routes.slice(2).map((route, offset) => (
            <TabBarItem
              key={route.key}
              route={route}
              index={offset + 2}
              state={state}
              navigation={navigation}
              descriptors={descriptors}
              onNavigate={closeMenu}
            />
          ))}
        </View>

        <View
          ref={addButtonRef}
          onLayout={measureTutorialTarget}
          collapsable={false}
          style={{
            position: 'absolute',
            width: 60,
            height: 60,
            left: center - 30,
            top: -30,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 30,
            zIndex: 4,
          }}
        >
          <PressableScale
            onPress={toggleMenu}
            haptic
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Close quick actions' : 'Open quick actions'}
            accessibilityState={{ expanded }}
          >
            <View
              style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.brand }}
            >
              <Animated.View style={plusStyle}>
                <Feather name="plus" size={31} color="#FFFFFF" />
              </Animated.View>
            </View>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}
