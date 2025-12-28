import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Animated, {
  FadeIn,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import HomeScreen from '../screens/Home/HomeScreen';
import TransactionsScreen from '../screens/Transactions/TransactionsScreen';
import AddEditExpenseScreen from '../screens/Transactions/AddEditExpenseScreen';
import AddEditIncomeScreen from '../screens/Transactions/AddEditIncomeScreen';
import ExpenseDetailScreen from '../screens/Transactions/ExpenseDetailScreen';
import IncomeDetailScreen from '../screens/Transactions/IncomeDetailScreen';
import AddTransferScreen from '../screens/Transactions/AddTransferScreen';
import BudgetsScreen from '../screens/Budgets/BudgetsScreen';
import AddEditBudgetScreen from '../screens/Budgets/AddEditBudgetScreen';
import GoalsScreen from '../screens/Goals/GoalsScreen';
import AddEditBucketScreen from '../screens/Goals/AddEditBucketScreen';
import AddEditWishlistItemScreen from '../screens/Goals/AddEditWishlistItemScreen';
import InsightsScreen from '../screens/Insights/InsightsScreen';
import AccountsScreen from '../screens/Accounts/AccountsScreen';
import AddEditAccountScreen from '../screens/Accounts/AddEditAccountScreen';
import CategoriesScreen from '../screens/Categories/CategoriesScreen';
import AddEditCategoryScreen from '../screens/Categories/AddEditCategoryScreen';
import ReceiptInboxScreen from '../screens/Receipts/ReceiptInboxScreen';
import RecurringScreen from '../screens/Recurring/RecurringScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import CurrenciesScreen from '../screens/Settings/CurrenciesScreen';
import WidgetsScreen from '../screens/Settings/WidgetsScreen';
import { colors } from '../theme/tokens';
import { PressableScale } from '../components/PressableScale';
import { HeaderIconButton } from '../components/HeaderIconButton';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const TAB_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Feather.glyphMap }
> = {
  HomeStack: { label: 'Home', icon: 'home' },
  TransactionsStack: { label: 'Transactions', icon: 'list' },
  BudgetsStack: { label: 'Budgets', icon: 'pie-chart' },
  GoalsStack: { label: 'Goals', icon: 'target' },
  InsightsStack: { label: 'Insights', icon: 'bar-chart-2' },
};

const STACK_ROOTS: Record<string, string> = {
  HomeStack: 'Home',
  TransactionsStack: 'Transactions',
  BudgetsStack: 'Budgets',
  GoalsStack: 'Goals',
  InsightsStack: 'Insights',
};

const createStackScreenOptions =
  (palette: typeof colors.light) =>
    ({ navigation }: { navigation: any }) => ({
      headerShown: true,
      headerBackTitleVisible: false,
      headerTitleAlign: 'center' as const,
      headerStyle: { backgroundColor: palette.bg },
      headerTintColor: palette.text,
      headerShadowVisible: false,
      headerTitleStyle: {
        fontFamily: 'Manrope_600SemiBold',
        fontSize: 20,
        color: palette.text,
      },
      headerLeftContainerStyle: { paddingLeft: 16 },
      headerRightContainerStyle: { paddingRight: 16 },
      headerLeft: ({ canGoBack }: { canGoBack?: boolean }) =>
        canGoBack ? (
          <HeaderIconButton
            icon="arrow-left"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back"
          />
        ) : null,
    });

function HomeStack() {
  const { colorScheme } = useColorScheme();
  const palette = colorScheme === 'dark' ? colors.dark : colors.light;
  const screenOptions = createStackScreenOptions(palette);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Worthy', headerShown: false }} />
      <Stack.Screen name="Accounts" component={AccountsScreen} options={{ title: 'Accounts' }} />
      <Stack.Screen
        name="AccountForm"
        component={AddEditAccountScreen}
        options={{ title: 'Account' }}
      />
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: 'Categories' }}
      />
      <Stack.Screen
        name="CategoryForm"
        component={AddEditCategoryScreen}
        options={{ title: 'Category' }}
      />
      <Stack.Screen
        name="ReceiptInbox"
        component={ReceiptInboxScreen}
        options={{ title: 'Receipt Inbox' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Currencies" component={CurrenciesScreen} options={{ title: 'Currencies' }} />
      <Stack.Screen name="Widgets" component={WidgetsScreen} options={{ title: 'Widgets' }} />
      <Stack.Screen name="Recurring" component={RecurringScreen} options={{ title: 'Recurring' }} />
      <Stack.Screen
        name="AddExpense"
        component={AddEditExpenseScreen}
        options={{ title: 'Add Expense' }}
      />
      <Stack.Screen
        name="AddIncome"
        component={AddEditIncomeScreen}
        options={{ title: 'Add Income' }}
      />
      <Stack.Screen
        name="AddTransfer"
        component={AddTransferScreen}
        options={{ title: 'Transfer' }}
      />
    </Stack.Navigator>
  );
}

function TransactionsStack() {
  const { colorScheme } = useColorScheme();
  const palette = colorScheme === 'dark' ? colors.dark : colors.light;
  const screenOptions = createStackScreenOptions(palette);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ title: 'Transactions', headerShown: false }}
      />
      <Stack.Screen
        name="AddExpense"
        component={AddEditExpenseScreen}
        options={{ title: 'Add Expense' }}
      />
      <Stack.Screen
        name="AddIncome"
        component={AddEditIncomeScreen}
        options={{ title: 'Add Income' }}
      />
      <Stack.Screen
        name="AddTransfer"
        component={AddTransferScreen}
        options={{ title: 'Transfer' }}
      />
      <Stack.Screen
        name="ExpenseDetail"
        component={ExpenseDetailScreen}
        options={{ title: 'Expense' }}
      />
      <Stack.Screen
        name="IncomeDetail"
        component={IncomeDetailScreen}
        options={{ title: 'Income' }}
      />
      <Stack.Screen
        name="ReceiptInbox"
        component={ReceiptInboxScreen}
        options={{ title: 'Receipt Inbox' }}
      />
    </Stack.Navigator>
  );
}

function BudgetsStack() {
  const { colorScheme } = useColorScheme();
  const palette = colorScheme === 'dark' ? colors.dark : colors.light;
  const screenOptions = createStackScreenOptions(palette);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Budgets" component={BudgetsScreen} options={{ title: 'Budgets', headerShown: false }} />
      <Stack.Screen
        name="BudgetForm"
        component={AddEditBudgetScreen}
        options={{ title: 'Budget' }}
      />
    </Stack.Navigator>
  );
}

function GoalsStack() {
  const { colorScheme } = useColorScheme();
  const palette = colorScheme === 'dark' ? colors.dark : colors.light;
  const screenOptions = createStackScreenOptions(palette);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Goals" component={GoalsScreen} options={{ title: 'Goals', headerShown: false }} />
      <Stack.Screen
        name="BucketForm"
        component={AddEditBucketScreen}
        options={{ title: 'Savings Bucket' }}
      />
      <Stack.Screen
        name="WishlistForm"
        component={AddEditWishlistItemScreen}
        options={{ title: 'Wishlist Item' }}
      />
    </Stack.Navigator>
  );
}

function InsightsStack() {
  const { colorScheme } = useColorScheme();
  const palette = colorScheme === 'dark' ? colors.dark : colors.light;
  const screenOptions = createStackScreenOptions(palette);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights', headerShown: false }} />
    </Stack.Navigator>
  );
}

function TabBarItem({ route, index, state, navigation, descriptors }: {
  route: any,
  index: number,
  state: any,
  navigation: any,
  descriptors: any
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? colors.dark : colors.light;
  const activeIconColor = '#FFFFFF';
  const inactiveIconColor = palette.muted;
  const pillBackground = palette.brand;

  const focused = state.index === index;
  const config = TAB_CONFIG[route.name] ?? {
    label: route.name,
    icon: 'circle',
  };
  const onPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (event.defaultPrevented) return;
    const rootScreen = STACK_ROOTS[route.name];
    if (rootScreen) {
      navigation.navigate(route.name, { screen: rootScreen });
    } else {
      navigation.navigate(route.name);
    }
  };
  const onLongPress = () => {
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  };
  const { options } = descriptors[route.key];
  const label =
    typeof options.tabBarLabel === 'string'
      ? options.tabBarLabel
      : typeof options.title === 'string'
        ? options.title
        : config.label;

  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, { duration: 40 });
  }, [focused, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      flex: withSpring(interpolate(progress.value, [0, 1], [0.8, 2.4]), {
        damping: 15,
        stiffness: 120,
      }),
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        ['rgba(0,0,0,0)', pillBackground],
      ),
    };
  });

  return (
    <Animated.View
      key={route.key}
      style={[
        {
          borderRadius: 999,
          marginHorizontal: 4,
          height: 46,

        },
        animatedStyle,
      ]}
    >
      <PressableScale haptic onPress={onPress} onLongPress={onLongPress}>
        <View
          style={{
            height: 46,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: focused ? 0 : 0,
          }}
        >
          <Feather
            name={config.icon}
            size={20}
            color={focused ? activeIconColor : inactiveIconColor}
          />
          {focused ? (
            <Animated.View entering={FadeIn.delay(200)}>
              <Text
                numberOfLines={1}
                style={{
                  marginLeft: 5,
                  fontFamily: 'Manrope_600SemiBold',
                  fontSize: 12,
                  color: activeIconColor,
                  flexShrink: 1,
                }}
              >
                {label}
              </Text>
            </Animated.View>
          ) : null}
        </View>
      </PressableScale>
    </Animated.View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? colors.dark : colors.light;
  const navBackground = isDark ? palette.surface : palette.surface;
  const navBorder = isDark ? palette.border : palette.border;

  return (
    <View
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 18,
        backgroundColor: navBackground,
        borderColor: navBorder,
        borderWidth: 1,

        borderRadius: 32,
        paddingVertical: 0,
        paddingHorizontal: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.4 : 0.14,
        shadowRadius: isDark ? 20 : 16,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,


      }}
    >
      {state.routes.map((route, index) => (
        <TabBarItem
          key={route.key}
          route={route}
          index={index}
          state={state}
          navigation={navigation}
          descriptors={descriptors}
        />
      ))}
    </View>
  );
}

import OnboardingNavigator from './OnboardingNavigator';
import { useSettingsStore } from '../state/useSettingsStore';
import { TutorialProvider } from '../components/tutorial/TutorialProvider';
import { TutorialOverlay } from '../components/tutorial/TutorialOverlay';

export default function RootNavigator() {
  const { isOnboarded } = useSettingsStore();

  if (!isOnboarded) {
    return <OnboardingNavigator />;
  }

  return (
    <TutorialProvider>
      <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tab.Screen
          name="HomeStack"
          component={HomeStack}
          options={{
            title: 'Home',
          }}
        />
        <Tab.Screen
          name="TransactionsStack"
          component={TransactionsStack}
          options={{
            title: 'Transactions',
          }}
        />
        <Tab.Screen
          name="BudgetsStack"
          component={BudgetsStack}
          options={{
            title: 'Budgets',
          }}
        />
        <Tab.Screen
          name="GoalsStack"
          component={GoalsStack}
          options={{
            title: 'Goals',
          }}
        />
        <Tab.Screen
          name="InsightsStack"
          component={InsightsStack}
          options={{
            title: 'Insights',
          }}
        />
      </Tab.Navigator>
      <TutorialOverlay />
    </TutorialProvider>
  );
}
