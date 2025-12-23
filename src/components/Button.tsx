import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

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
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Pressable
      className={`flex-row items-center justify-center rounded-xl px-4 py-3 ${variants[variant]} ${
        disabled ? 'opacity-40' : ''
      }`}
      onPress={async () => {
        if (disabled) return;
        await Haptics.selectionAsync();
        await onPress();
      }}
    >
      {icon ? <View className="mr-2">{icon}</View> : null}
      <Text className={`text-base font-semibold ${textVariants[variant]}`}>{title}</Text>
    </Pressable>
  );
}
