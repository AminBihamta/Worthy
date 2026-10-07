import '../global.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Text, TextInput, View } from 'react-native';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'nativewind';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import RootNavigator from './navigation/RootNavigator';
import { DatabaseProvider, useDatabaseStatus } from './db/provider';
import { useSettingsStore } from './state/useSettingsStore';
import { getNavigationTheme } from './theme/navigation';
import { colors } from './theme/tokens';
import { syncHomeScreenWidgets } from './services/homeScreenWidgetSync';
import { applyThemeMode } from './theme/appearance';

SplashScreen.setOptions({ duration: 180, fade: true });
void SplashScreen.preventAutoHideAsync().catch((error) => {
  if (__DEV__) {
    console.warn('[splash] unable to hold native splash screen', error);
  }
});

if (Platform.OS === 'ios') {
  try {
    require('./widgets');
  } catch (error) {
    if (__DEV__) {
      console.warn('[widgets] failed to register', error);
    }
  }
}

const linking: LinkingOptions<any> = {
  prefixes: [Linking.createURL('/'), 'worthy://'],
  config: {
    screens: {
      HomeStack: {
        screens: {
          Home: '',
          AddExpense: 'add-expense',
          Settings: 'settings',
        },
      },
      TransactionsStack: {
        path: 'transactions',
        screens: {
          Transactions: '',
          AddExpense: 'add-expense',
        },
      },
    },
  },
};

function AppContent() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const { ready, error } = useDatabaseStatus();
  const { hydrate, themeMode, loaded } = useSettingsStore();
  const { colorScheme } = useColorScheme();
  const didSetFonts = useRef(false);
  const didHideSplash = useRef(false);
  const [settingsError, setSettingsError] = useState<Error | null>(null);

  const handleRootLayout = useCallback(() => {
    if (didHideSplash.current) return;
    didHideSplash.current = true;
    requestAnimationFrame(() => {
      void SplashScreen.hideAsync();
    });
  }, []);

  useEffect(() => {
    if (!fontsLoaded || didSetFonts.current) return;
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = [{ fontFamily: 'Manrope_400Regular' }, Text.defaultProps.style];
    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = [
      { fontFamily: 'Manrope_400Regular' },
      TextInput.defaultProps.style,
    ];
    didSetFonts.current = true;
  }, [fontsLoaded]);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    hydrate().catch((loadError) => {
      if (active) {
        setSettingsError(
          loadError instanceof Error ? loadError : new Error('Unable to load settings'),
        );
      }
    });
    return () => {
      active = false;
    };
  }, [ready, hydrate]);

  useEffect(() => {
    if (!loaded) return;
    applyThemeMode(themeMode);
  }, [themeMode, loaded]);

  useEffect(() => {
    if (!ready || !loaded) return;
    void syncHomeScreenWidgets();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void syncHomeScreenWidgets();
      }
    });

    return () => subscription.remove();
  }, [ready, loaded]);

  const resolvedScheme = themeMode === 'system' ? (colorScheme ?? 'light') : themeMode;

  const backgroundColor =
    resolvedScheme === 'dark' ? colors.dark.bg : colors.light.bg;

  if ((!ready && !error) || (!fontsLoaded && !fontError) || (ready && !loaded && !settingsError)) {
    return null;
  }

  if (error || settingsError) {
    return (
      <SafeAreaView
        onLayout={handleRootLayout}
        style={{ flex: 1, backgroundColor }}
        edges={['top']}
      >
        <View className="flex-1 bg-app-bg dark:bg-app-bg-dark items-center justify-center">
          <Text className="text-sm text-app-muted dark:text-app-muted-dark">
            {error ? 'Database error.' : 'Unable to load settings.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      onLayout={handleRootLayout}
      style={{ flex: 1, backgroundColor }}
      edges={['top']}
    >
      <NavigationContainer
        linking={linking}
        theme={getNavigationTheme(resolvedScheme as 'light' | 'dark')}
      >
        <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DatabaseProvider>
          <AppContent />
        </DatabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
