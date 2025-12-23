import React from 'react';
import { Text, View } from 'react-native';

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="py-12 items-center">
      <Text className="text-lg font-semibold text-app-text dark:text-app-text-dark mb-2">
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-sm text-app-muted dark:text-app-muted-dark text-center px-6">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
