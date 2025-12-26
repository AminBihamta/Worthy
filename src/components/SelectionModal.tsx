import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { id: string; name: string; subtitle?: string }[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export function SelectionModal({
  visible,
  onClose,
  title,
  options,
  onSelect,
  selectedId,
}: SelectionModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose}>
        <View className="flex-1 justify-end">
          <Pressable className="bg-app-card dark:bg-app-card-dark rounded-t-[32px] overflow-hidden h-[70%]">
            <View className="items-center pt-4 pb-2">
              <View className="w-12 h-1.5 rounded-full bg-app-border dark:bg-app-border-dark" />
            </View>
            <View className="px-6 py-4 border-b border-app-border/50 dark:border-app-border-dark/50 flex-row justify-between items-center">
              <Text className="text-xl font-display text-app-text dark:text-app-text-dark">
                {title}
              </Text>
              <Pressable onPress={onClose} className="p-2 -mr-2">
                <Feather name="x" size={24} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              {options.map((option) => (
                <PressableScale
                  key={option.id}
                  className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl border ${
                    selectedId === option.id
                      ? 'bg-app-soft dark:bg-app-soft-dark border-app-brand dark:border-app-brand-dark'
                      : 'bg-transparent border-app-border dark:border-app-border-dark'
                  }`}
                  onPress={() => {
                    onSelect(option.id);
                    onClose();
                  }}
                >
                  <View>
                    <Text
                      className={`text-base font-medium ${
                        selectedId === option.id
                          ? 'text-app-brand dark:text-app-brand-dark'
                          : 'text-app-text dark:text-app-text-dark'
                      }`}
                    >
                      {option.name}
                    </Text>
                    {option.subtitle && (
                      <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-0.5">
                        {option.subtitle}
                      </Text>
                    )}
                  </View>
                  {selectedId === option.id && (
                    <Feather name="check" size={20} color={isDark ? '#58D5D8' : '#0A9396'} />
                  )}
                </PressableScale>
              ))}
            </ScrollView>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
