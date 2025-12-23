import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import WidgetsScreen from '../screens/Settings/WidgetsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Worthy' }} />
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
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ title: 'Transactions' }}
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
  return (
    <Stack.Navigator>
      <Stack.Screen name="Budgets" component={BudgetsScreen} options={{ title: 'Budgets' }} />
      <Stack.Screen
        name="BudgetForm"
        component={AddEditBudgetScreen}
        options={{ title: 'Budget' }}
      />
    </Stack.Navigator>
  );
}

function GoalsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Goals" component={GoalsScreen} options={{ title: 'Goals' }} />
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
  return (
    <Stack.Navigator>
      <Stack.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#151A1A' : '#FFFFFF',
          borderTopColor: isDark ? '#2C3333' : '#E6E4DF',
        },
        tabBarActiveTintColor: isDark ? '#4EC3B5' : '#2F6F62',
        tabBarInactiveTintColor: isDark ? '#A6ADB5' : '#6B6F76',
      }}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStack}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="TransactionsStack"
        component={TransactionsStack}
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => <Feather name="list" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="BudgetsStack"
        component={BudgetsStack}
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color, size }) => <Feather name="pie-chart" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="GoalsStack"
        component={GoalsStack}
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size }) => <Feather name="target" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="InsightsStack"
        component={InsightsStack}
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <Feather name="bar-chart-2" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
