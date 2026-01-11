import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import { PressableScale } from '../../components/PressableScale';
import { WrappedCarousel } from '../../components/WrappedCarousel';
import { WrapPeriod } from '../../utils/wrap';

export default function WrappedScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const initialPeriod = (route.params as { period?: WrapPeriod } | undefined)?.period ?? 'week';

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <View style={{ paddingTop: Math.max(0, insets.top - 8) }} className="px-6 pb-0">
        <View className="flex-row items-center justify-between">
          <PressableScale onPress={() => navigation.goBack()}>
            <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center border border-app-border dark:border-app-border-dark">
              <Feather name="arrow-left" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
            </View>
          </PressableScale>
          <Text className="text-lg font-display text-app-text dark:text-app-text-dark">
            Wrapped
          </Text>
          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <WrappedCarousel initialPeriod={initialPeriod} />
      </ScrollView>
    </View>
  );
}
