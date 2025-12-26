import React, { useState } from 'react';
import { ScrollView, Text, TextInput, View, Switch, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';

import { Card } from '../../components/Card';
import { PressableScale } from '../../components/PressableScale';
import { useSettingsStore } from '../../state/useSettingsStore';
import { toMinor } from '../../utils/money';
import { generateSampleData } from '../../db/sampleData';

function SettingsSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      {title && (
        <Text className="px-4 mb-2 text-xs font-medium uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
          {title}
        </Text>
      )}
      <View className="bg-app-card dark:bg-app-card-dark rounded-3xl overflow-hidden border border-app-border/50 dark:border-app-border-dark/50">
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  isLast = false,
  isDestructive = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  isLast?: boolean;
  isDestructive?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <PressableScale onPress={onPress}>
      <View
        className={`flex-row items-center justify-between p-4 ${
          !isLast ? 'border-b border-app-border/30 dark:border-app-border-dark/30' : ''
        }`}
      >
        <View className="flex-row items-center gap-4">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDestructive ? 'bg-app-danger/10' : 'bg-app-soft dark:bg-app-soft-dark'
            }`}
          >
            <Feather
              name={icon}
              size={18}
              color={isDestructive ? '#EF4444' : isDark ? '#F9E6F4' : '#2C0C4D'}
            />
          </View>
          <Text
            className={`text-base font-medium ${
              isDestructive ? 'text-app-danger' : 'text-app-text dark:text-app-text-dark'
            }`}
          >
            {label}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {value && (
            <Text className="text-base text-app-muted dark:text-app-muted-dark">{value}</Text>
          )}
          <Feather name="chevron-right" size={16} color={isDark ? '#C8A9C2' : '#8A6B9A'} />
        </View>
      </View>
    </PressableScale>
  );
}

function SettingsInputRow({
  icon,
  label,
  value,
  onChangeText,
  onEndEditing,
  placeholder,
  isLast = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onEndEditing?: () => void;
  placeholder?: string;
  isLast?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className={`flex-row items-center justify-between p-4 ${
        !isLast ? 'border-b border-app-border/30 dark:border-app-border-dark/30' : ''
      }`}
    >
      <View className="flex-row items-center gap-4">
        <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
          <Feather name={icon} size={18} color={isDark ? '#F9E6F4' : '#2C0C4D'} />
        </View>
        <Text className="text-base font-medium text-app-text dark:text-app-text-dark">{label}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onEndEditing={onEndEditing}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#C8A9C2' : '#8A6B9A'}
        keyboardType="decimal-pad"
        className="text-base text-app-brand dark:text-app-brand-dark font-medium text-right min-w-[80px]"
      />
    </View>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const {
    themeMode,
    setThemeMode,
    fixedHourlyRateMinor,
    setFixedHourlyRateMinor,
    hoursPerDay,
    setHoursPerDay,
  } = useSettingsStore();

  const [hourlyRate, setHourlyRate] = useState(
    fixedHourlyRateMinor ? String(fixedHourlyRateMinor / 100) : '',
  );
  const [hoursInput, setHoursInput] = useState(String(hoursPerDay));

  const handleSaveHourlyRate = () => {
    const minor = toMinor(hourlyRate);
    setFixedHourlyRateMinor(minor);
  };

  const handleSaveHoursPerDay = () => {
    const hours = Number.parseInt(hoursInput || '8', 10);
    setHoursPerDay(hours);
  };

  const cycleTheme = () => {
    const modes: ('system' | 'light' | 'dark')[] = ['system', 'light', 'dark'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
    Haptics.selectionAsync();
  };

  const themeLabel = themeMode.charAt(0).toUpperCase() + themeMode.slice(1);

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}>
        
        {/* Header */}
        <View className="px-6 mb-8">
          <Text className="text-4xl font-display text-app-text dark:text-app-text-dark">
            Settings
          </Text>
          <Text className="text-base text-app-muted dark:text-app-muted-dark mt-1">
            Preferences & Configuration
          </Text>
        </View>

        <View className="px-4">
          {/* Appearance */}
          <SettingsSection title="Appearance">
            <PressableScale onPress={cycleTheme}>
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                    <Feather name={themeMode === 'dark' ? 'moon' : 'sun'} size={18} color={isDark ? '#F9E6F4' : '#2C0C4D'} />
                  </View>
                  <Text className="text-base font-medium text-app-text dark:text-app-text-dark">
                    Theme
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-app-muted dark:text-app-muted-dark">
                    {themeLabel}
                  </Text>
                  <Feather name="chevron-right" size={16} color={isDark ? '#C8A9C2' : '#8A6B9A'} />
                </View>
              </View>
            </PressableScale>
          </SettingsSection>

          {/* Life Cost */}
          <SettingsSection title="Life Cost Calculator">
            <SettingsInputRow
              icon="clock"
              label="Hourly Rate"
              value={hourlyRate}
              onChangeText={setHourlyRate}
              onEndEditing={handleSaveHourlyRate}
              placeholder="0.00"
            />
            <SettingsInputRow
              icon="sun"
              label="Hours per Day"
              value={hoursInput}
              onChangeText={setHoursInput}
              onEndEditing={handleSaveHoursPerDay}
              placeholder="8"
              isLast
            />
          </SettingsSection>

          {/* Management */}
          <SettingsSection title="Management">
            <SettingsRow
              icon="grid"
              label="Widgets"
              onPress={() => navigation.navigate('Widgets' as never)}
            />
            <SettingsRow
              icon="credit-card"
              label="Accounts"
              onPress={() => navigation.navigate('Accounts' as never)}
            />
            <SettingsRow
              icon="tag"
              label="Categories"
              onPress={() => navigation.navigate('Categories' as never)}
            />
            <SettingsRow
              icon="repeat"
              label="Recurring Rules"
              onPress={() => navigation.navigate('Recurring' as never)}
            />
            <SettingsRow
              icon="inbox"
              label="Receipt Inbox"
              onPress={() => navigation.navigate('ReceiptInbox' as never)}
              isLast
            />
          </SettingsSection>

          {/* Data */}
          {__DEV__ && (
            <SettingsSection title="Development">
              <SettingsRow
                icon="database"
                label="Generate Sample Data"
                onPress={async () => {
                  await generateSampleData();
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                isLast
              />
            </SettingsSection>
          )}
          
          <View className="items-center mt-4 mb-8">
            <Text className="text-xs text-app-muted dark:text-app-muted-dark">
              Worthy v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
