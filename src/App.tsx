import '../global.css';
import React, { useEffect, useRef } from 'react';
import { Text, TextInput, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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

function AppContent() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const { ready, error } = useDatabaseStatus();
  const { hydrate, themeMode, loaded } = useSettingsStore();
  const { colorScheme, setColorScheme } = useColorScheme();
  const didSetFonts = useRef(false);

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
    if (ready) {
      hydrate();
    }
  }, [ready, hydrate]);

  useEffect(() => {
    if (!loaded) return;
    setColorScheme(themeMode);
  }, [themeMode, loaded, setColorScheme]);

  const resolvedScheme = themeMode === 'system' ? (colorScheme ?? 'light') : themeMode;

  if (!ready || !fontsLoaded) {
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

  const backgroundColor =
    resolvedScheme === 'dark' ? colors.dark.bg : colors.light.bg;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top']}>
      <NavigationContainer theme={getNavigationTheme(resolvedScheme as 'light' | 'dark')}>
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
