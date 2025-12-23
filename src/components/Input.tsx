import React from 'react';
import { Text, TextInput, View } from 'react-native';

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
  return (
    <View className="mb-4">
      <Text className="text-sm text-app-muted dark:text-app-muted-dark mb-2">{label}</Text>
      <TextInput
        className={`rounded-xl border border-app-border dark:border-app-border-dark bg-white dark:bg-app-surface-dark px-4 py-3 text-base text-app-text dark:text-app-text-dark ${
          multiline ? 'h-24' : ''
        }`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA0A6"
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}
