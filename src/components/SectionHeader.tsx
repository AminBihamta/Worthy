import React from 'react';
import { Text, View } from 'react-native';

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-lg font-display text-app-text dark:text-app-text-dark">{title}</Text>
      {action}
    </View>
  );
}
