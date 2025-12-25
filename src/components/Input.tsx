import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { useColorScheme } from 'nativewind';

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'decimal-pad';
  multiline?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const placeholderColor = colorScheme === 'dark' ? '#C8A9C2' : '#B892C4';

  return (
    <View className="mb-4">
      <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-2">
        {label}
      </Text>
      <TextInput
        className={`rounded-2xl border border-transparent bg-app-soft dark:bg-app-soft-dark px-4 py-3 text-base text-app-text dark:text-app-text-dark ${
          multiline ? 'h-28' : ''
        }`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}
