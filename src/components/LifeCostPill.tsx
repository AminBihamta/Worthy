import React from 'react';
import { Text, View } from 'react-native';

export function LifeCostPill({ value }: { value: string }) {
  return (
    <View className="rounded-full bg-app-accent/20 px-3 py-1">
      <Text className="text-xs font-semibold text-app-accent">{value}</Text>
    </View>
  );
}
