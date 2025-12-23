import React from 'react';
import { Pressable, Text, View } from 'react-native';

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row rounded-xl border border-app-border dark:border-app-border-dark overflow-hidden">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            className={`flex-1 px-3 py-2 ${
              active ? 'bg-app-brand dark:bg-app-brand-dark' : 'bg-transparent'
            }`}
            onPress={() => onChange(option.value)}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                active ? 'text-white' : 'text-app-text dark:text-app-text-dark'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
