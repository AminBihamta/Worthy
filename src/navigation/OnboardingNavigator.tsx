
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'nativewind';
import { colors } from '../theme/tokens';
import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';
import AccountsSetupScreen from '../screens/Onboarding/AccountsSetupScreen';
import CategorySetupScreen from '../screens/Onboarding/CategorySetupScreen';
import OnboardingAccountForm from '../screens/Onboarding/OnboardingAccountForm';
import { HeaderIconButton } from '../components/HeaderIconButton';

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
            headerLeft: ({ canGoBack }: { canGoBack: boolean }) =>
                canGoBack ? (
                    <HeaderIconButton
                        icon="arrow-left"
                        onPress={() => navigation.goBack()}
                        accessibilityLabel="Back"
                    />
                ) : null,
        });

export default function OnboardingNavigator() {
    const { colorScheme } = useColorScheme();
    const palette = colorScheme === 'dark' ? colors.dark : colors.light;
    const screenOptions = createStackScreenOptions(palette);

    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen
                name="Welcome"
                component={WelcomeScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AccountsSetup"
                component={AccountsSetupScreen}
                options={{ title: 'Add Accounts' }}
            />
            <Stack.Screen
                name="CategorySetup"
                component={CategorySetupScreen}
                options={{ title: 'Categories' }}
            />
            <Stack.Screen
                name="OnboardingAccountForm"
                component={OnboardingAccountForm}
                options={{ title: 'Add Account', presentation: 'modal' }}
            />
        </Stack.Navigator>
    );
}
