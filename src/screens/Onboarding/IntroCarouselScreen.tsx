import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { PressableScale } from '../../components/PressableScale';
import { useSettingsStore } from '../../state/useSettingsStore';

const slides = [
  {
    id: 'track',
    title: 'Track every move',
    description: 'Log expenses, income, and transfers in seconds.',
    icon: 'activity',
    accent: '#0A9396',
  },
  {
    id: 'life',
    title: 'Life cost insights',
    description: 'See how many hours each purchase really costs.',
    icon: 'clock',
    accent: '#EE9B00',
  },
  {
    id: 'capture',
    title: 'Quick capture',
    description: 'Snap receipts fast and match them later.',
    icon: 'camera',
    accent: '#38B000',
  },
  {
    id: 'privacy',
    title: 'Private & offline',
    description: 'Your data stays on your device. No servers, no tracking.',
    icon: 'shield',
    accent: '#5E60CE',
  },
  {
    id: 'free',
    title: 'Free forever',
    description: 'No subscriptions. No ads. Just Worthy.',
    icon: 'gift',
    accent: '#D62828',
  },
];

export default function IntroCarouselScreen({ navigation }: { navigation: any }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { hasSeenIntro, completeIntro } = useSettingsStore();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const width = Dimensions.get('window').width;

  useEffect(() => {
    if (hasSeenIntro) {
      navigation.replace('Welcome');
    }
  }, [hasSeenIntro, navigation]);

  const handleNext = useCallback(async () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      return;
    }
    await completeIntro();
    navigation.replace('Welcome');
  }, [completeIntro, index, navigation]);

  const handleSkip = useCallback(async () => {
    await completeIntro();
    navigation.replace('Welcome');
  }, [completeIntro, navigation]);

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <View style={{ paddingTop: insets.top + 16 }} className="px-6">
        <Text className="text-4xl font-display text-app-text dark:text-app-text-dark">
          Worthy
        </Text>
        <Text className="text-base text-app-muted dark:text-app-muted-dark mt-1">
          Your money, distilled.
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setIndex(nextIndex);
        }}
        renderItem={({ item }) => (
          <View style={{ width }} className="px-6 py-10">
            <View className="rounded-[36px] border border-app-border/50 dark:border-app-border-dark/50 bg-app-card dark:bg-app-card-dark p-8 overflow-hidden">
              <View
                className="absolute -top-16 -right-12 w-40 h-40 rounded-full"
                style={{ backgroundColor: item.accent, opacity: 0.15 }}
              />
              <View
                className="absolute -bottom-20 -left-16 w-44 h-44 rounded-full"
                style={{ backgroundColor: item.accent, opacity: 0.12 }}
              />
              <View className="w-14 h-14 rounded-2xl items-center justify-center mb-6" style={{ backgroundColor: item.accent }}>
                <Feather name={item.icon as any} size={26} color="#FFFFFF" />
              </View>
              <Text className="text-2xl font-display text-app-text dark:text-app-text-dark mb-3">
                {item.title}
              </Text>
              <Text className="text-base text-app-muted dark:text-app-muted-dark">
                {item.description}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={{ paddingBottom: insets.bottom + 24 }} className="px-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            {slides.map((slide, dotIndex) => (
              <View
                key={slide.id}
                className="h-2 rounded-full"
                style={{
                  width: dotIndex === index ? 18 : 8,
                  backgroundColor: dotIndex === index ? '#0A9396' : isDark ? '#2B2F36' : '#D1DDE6',
                }}
              />
            ))}
          </View>
          <PressableScale onPress={handleSkip}>
            <Text className="text-sm text-app-muted dark:text-app-muted-dark">Skip</Text>
          </PressableScale>
        </View>

        <Button title={index === slides.length - 1 ? 'Get started' : 'Next'} onPress={handleNext} />
      </View>
    </View>
  );
}
