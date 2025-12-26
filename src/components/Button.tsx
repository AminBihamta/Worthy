import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';

const variants = {
  primary: 'bg-app-brand dark:bg-app-brand-dark',
  secondary:
    'bg-app-surface dark:bg-app-surface-dark border border-app-border dark:border-app-border-dark',
  ghost: 'bg-transparent',
  danger: 'bg-app-danger',
};

const textVariants = {
  primary: 'text-white',
  secondary: 'text-app-text dark:text-app-text-dark',
  ghost: 'text-app-text dark:text-app-text-dark',
  danger: 'text-white',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
}: {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: keyof typeof variants;
  icon?: React.ReactNode | ((color: string) => React.ReactNode);
  disabled?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor =
    variant === 'primary' || variant === 'danger' ? '#FFFFFF' : isDark ? '#E6EDF3' : '#0D1B2A';
  const renderedIcon = typeof icon === 'function' ? icon(iconColor) : icon;

  return (
    <Pressable
      className={`flex-row items-center justify-center rounded-full px-5 py-3 ${variants[variant]} ${
        disabled ? 'opacity-40' : ''
      }`}
      onPress={async () => {
        if (disabled) return;
        await Haptics.selectionAsync();
        await onPress();
      }}
    >
      {renderedIcon ? <View className="mr-2">{renderedIcon}</View> : null}
      <Text className={`text-sm font-emphasis ${textVariants[variant]}`}>{title}</Text>
    </Pressable>
  );
}
