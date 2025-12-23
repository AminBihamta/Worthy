import '../global.css';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import RootNavigator from './navigation/RootNavigator';
import { DatabaseProvider, useDatabaseStatus } from './db/provider';
import { useSettingsStore } from './state/useSettingsStore';
import { getNavigationTheme } from './theme/navigation';

function AppContent() {
  const { ready, error } = useDatabaseStatus();
  const { hydrate, themeMode, loaded } = useSettingsStore();
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    if (ready) {
      hydrate();
    }
  }, [ready, hydrate]);

  useEffect(() => {
    if (!loaded) return;
    setColorScheme(themeMode);
  }, [themeMode, loaded, setColorScheme]);

  const resolvedScheme = themeMode === 'system' ? (colorScheme ?? 'light') : themeMode;

  if (!ready) {
    return (
      <View className="flex-1 bg-app-bg dark:bg-app-bg-dark items-center justify-center">
        <Text className="text-sm text-app-muted dark:text-app-muted-dark">Preparing Worthy...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-app-bg dark:bg-app-bg-dark items-center justify-center">
        <Text className="text-sm text-app-muted dark:text-app-muted-dark">Database error.</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={getNavigationTheme(resolvedScheme as 'light' | 'dark')}>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
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
