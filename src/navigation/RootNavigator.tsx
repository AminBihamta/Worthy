import React from 'react';
import { Text, View } from 'react-native';
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
import { colors } from '../theme/tokens';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? colors.dark : colors.light;
  const activeIconColor = '#FFFFFF';
  const renderTabLabel = (label: string, focused: boolean) => (
    <Text
      style={{
        fontFamily: focused ? 'Manrope_600SemiBold' : 'Manrope_500Medium',
        fontSize: 11,
        color: focused ? palette.brand : palette.muted,
      }}
    >
      {label}
    </Text>
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 18,
          backgroundColor: palette.surface,
          borderColor: palette.border,
          borderWidth: 1,
          borderTopWidth: 1,
          height: 72,
          borderRadius: 26,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 8,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        },
        tabBarActiveTintColor: palette.brand,
        tabBarInactiveTintColor: palette.muted,
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStack}
        options={{
          title: 'Home',
          tabBarLabel: ({ focused }) => renderTabLabel('Home', focused),
          tabBarIcon: ({ size, focused, color }) => (
            <View
              style={{
                height: 36,
                width: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? palette.brand : 'transparent',
                shadowColor: focused ? palette.brand : 'transparent',
                shadowOpacity: focused ? 0.25 : 0,
                shadowRadius: focused ? 10 : 0,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <Feather name="home" size={size} color={focused ? activeIconColor : color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="TransactionsStack"
        component={TransactionsStack}
        options={{
          title: 'Transactions',
          tabBarLabel: ({ focused }) => renderTabLabel('Transactions', focused),
          tabBarIcon: ({ size, focused, color }) => (
            <View
              style={{
                height: 36,
                width: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? palette.brand : 'transparent',
                shadowColor: focused ? palette.brand : 'transparent',
                shadowOpacity: focused ? 0.25 : 0,
                shadowRadius: focused ? 10 : 0,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <Feather name="list" size={size} color={focused ? activeIconColor : color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="BudgetsStack"
        component={BudgetsStack}
        options={{
          title: 'Budgets',
          tabBarLabel: ({ focused }) => renderTabLabel('Budgets', focused),
          tabBarIcon: ({ size, focused, color }) => (
            <View
              style={{
                height: 36,
                width: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? palette.brand : 'transparent',
                shadowColor: focused ? palette.brand : 'transparent',
                shadowOpacity: focused ? 0.25 : 0,
                shadowRadius: focused ? 10 : 0,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <Feather name="pie-chart" size={size} color={focused ? activeIconColor : color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="GoalsStack"
        component={GoalsStack}
        options={{
          title: 'Goals',
          tabBarLabel: ({ focused }) => renderTabLabel('Goals', focused),
          tabBarIcon: ({ size, focused, color }) => (
            <View
              style={{
                height: 36,
                width: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? palette.brand : 'transparent',
                shadowColor: focused ? palette.brand : 'transparent',
                shadowOpacity: focused ? 0.25 : 0,
                shadowRadius: focused ? 10 : 0,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <Feather name="target" size={size} color={focused ? activeIconColor : color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="InsightsStack"
        component={InsightsStack}
        options={{
          title: 'Insights',
          tabBarLabel: ({ focused }) => renderTabLabel('Insights', focused),
          tabBarIcon: ({ size, focused, color }) => (
            <View
              style={{
                height: 36,
                width: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? palette.brand : 'transparent',
                shadowColor: focused ? palette.brand : 'transparent',
                shadowOpacity: focused ? 0.25 : 0,
                shadowRadius: focused ? 10 : 0,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <Feather name="bar-chart-2" size={size} color={focused ? activeIconColor : color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
