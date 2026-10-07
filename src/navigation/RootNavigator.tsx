import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import InsightsScreen from '../screens/Insights/InsightsScreen';
import AccountsScreen from '../screens/Accounts/AccountsScreen';
import AddEditAccountScreen from '../screens/Accounts/AddEditAccountScreen';
import CategoriesScreen from '../screens/Categories/CategoriesScreen';
import AddEditCategoryScreen from '../screens/Categories/AddEditCategoryScreen';
import RecurringScreen from '../screens/Recurring/RecurringScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import CurrenciesScreen from '../screens/Settings/CurrenciesScreen';
import PrivacyScreen from '../screens/Settings/PrivacyScreen';
import FeedbackScreen from '../screens/Settings/FeedbackScreen';
import WrappedScreen from '../screens/Settings/WrappedScreen';
import { colors } from '../theme/tokens';
import { HeaderIconButton } from '../components/HeaderIconButton';
import CustomTabBar from './CustomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
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
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '' }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacy' }} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: 'Feedback' }} />
      <Stack.Screen name="Currencies" component={CurrenciesScreen} options={{ title: 'Currencies' }} />
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

function InsightsStack() {
  const { colorScheme } = useColorScheme();
  const palette = colorScheme === 'dark' ? colors.dark : colors.light;
  const screenOptions = createStackScreenOptions(palette);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights', headerShown: false }} />
      <Stack.Screen name="Wrapped" component={WrappedScreen} options={{ title: 'Wrapped', headerShown: false }} />
    </Stack.Navigator>
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
