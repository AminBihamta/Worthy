import React from 'react';
import { Text, View } from 'react-native';

export function LifeCostPill({ value }: { value: string }) {
  return (
    <View className="rounded-full bg-app-soft dark:bg-app-soft-dark px-3 py-1">
      <Text className="text-xs text-app-muted dark:text-app-muted-dark">{value}</Text>
    </View>
  );
}
