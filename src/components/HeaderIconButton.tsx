import React from 'react';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { PressableScale } from './PressableScale';

export function HeaderIconButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <PressableScale
      onPress={onPress}
      haptic
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center"
    >
      <Feather name={icon} size={20} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
    </PressableScale>
  );
}
