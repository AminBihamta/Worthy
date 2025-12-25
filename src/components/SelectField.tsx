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
      <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-2">
        {label}
      </Text>
      <Pressable
        className="rounded-2xl border border-transparent bg-app-soft dark:bg-app-soft-dark px-4 py-3 flex-row items-center justify-between"
        onPress={() => setVisible(true)}
      >
        <Text className="text-base text-app-text dark:text-app-text-dark">
          {selected?.label ?? 'Select'}
        </Text>
        <Feather name="chevron-down" size={18} color="#8D929B" />
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="max-h-[70%] rounded-t-3xl bg-app-card dark:bg-app-card-dark p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-display text-app-text dark:text-app-text-dark">
                {label}
              </Text>
              <Pressable onPress={() => setVisible(false)}>
                <Feather name="x" size={20} color="#8D929B" />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
              <View className="gap-3">
                {options.map((option) => (
                  <Pressable
                    key={option.value}
                    className="rounded-2xl border border-app-border dark:border-app-border-dark px-4 py-3"
                    onPress={() => {
                      onChange(option.value);
                      setVisible(false);
                    }}
                  >
                    <Text className="text-base font-emphasis text-app-text dark:text-app-text-dark">
                      {option.label}
                    </Text>
                    {option.subtitle ? (
                      <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
                        {option.subtitle}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
