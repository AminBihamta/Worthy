import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface SelectOption {
  label: string;
  value: string;
  subtitle?: string;
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View className="mb-4">
      <Text className="text-sm text-app-muted dark:text-app-muted-dark mb-2">{label}</Text>
      <Pressable
        className="rounded-xl border border-app-border dark:border-app-border-dark bg-white dark:bg-app-surface-dark px-4 py-3 flex-row items-center justify-between"
        onPress={() => setVisible(true)}
      >
        <Text className="text-base text-app-text dark:text-app-text-dark">
          {selected?.label ?? 'Select'}
        </Text>
        <Feather name="chevron-down" size={18} color="#6B6F76" />
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="max-h-[70%] rounded-t-3xl bg-app-card dark:bg-app-card-dark p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-app-text dark:text-app-text-dark">
                {label}
              </Text>
              <Pressable onPress={() => setVisible(false)}>
                <Feather name="x" size={20} color="#6B6F76" />
              </Pressable>
            </View>
            <ScrollView className="space-y-2">
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  className="rounded-xl border border-app-border dark:border-app-border-dark px-4 py-3"
                  onPress={() => {
                    onChange(option.value);
                    setVisible(false);
                  }}
                >
                  <Text className="text-base font-semibold text-app-text dark:text-app-text-dark">
                    {option.label}
                  </Text>
                  {option.subtitle ? (
                    <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
                      {option.subtitle}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
