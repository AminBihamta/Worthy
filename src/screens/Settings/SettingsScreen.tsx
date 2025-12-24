import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SelectField } from '../../components/SelectField';
import { SectionHeader } from '../../components/SectionHeader';
import { Card } from '../../components/Card';
import { useSettingsStore } from '../../state/useSettingsStore';
import { toMinor } from '../../utils/money';
import { generateSampleData } from '../../db/sampleData';

export default function SettingsScreen() {
  const navigation = useNavigation();
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

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 24 }}
    >
      <SectionHeader title="Appearance" />
      <Card className="mb-6">
        <SelectField
          label="Theme"
          value={themeMode}
          options={[
            { label: 'System', value: 'system' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]}
          onChange={(value) => setThemeMode(value as any)}
        />
      </Card>

      <SectionHeader title="Life cost" />
      <Card className="mb-6">
        <Input
          label="Fixed hourly rate"
          value={hourlyRate}
          onChangeText={setHourlyRate}
          placeholder="Optional"
          keyboardType="decimal-pad"
        />
        <Button
          title="Save hourly rate"
          variant="secondary"
          onPress={() => setFixedHourlyRateMinor(toMinor(hourlyRate))}
        />
        <View className="mt-4">
          <Input
            label="Hours per day"
            value={hoursInput}
            onChangeText={setHoursInput}
            placeholder="8"
            keyboardType="numeric"
          />
          <Button
            title="Save hours per day"
            variant="secondary"
            onPress={() => setHoursPerDay(Number.parseInt(hoursInput || '8', 10))}
          />
        </View>
      </Card>

      <SectionHeader title="Quick links" />
      <Card className="mb-6">
        <Button
          title="Widgets"
          variant="secondary"
          onPress={() => navigation.navigate('Widgets' as never)}
        />
        <View className="mt-3" />
        <Button
          title="Accounts"
          variant="secondary"
          onPress={() => navigation.navigate('Accounts' as never)}
        />
        <View className="mt-3" />
        <Button
          title="Categories"
          variant="secondary"
          onPress={() => navigation.navigate('Categories' as never)}
        />
        <View className="mt-3" />
        <Button
          title="Receipt Inbox"
          variant="secondary"
          onPress={() => navigation.navigate('ReceiptInbox' as never)}
        />
        <View className="mt-3" />
        <Button
          title="Recurring"
          variant="secondary"
          onPress={() => navigation.navigate('Recurring' as never)}
        />
      </Card>

      {__DEV__ ? (
        <Card>
          <Button
            title="Generate sample data"
            variant="secondary"
            onPress={async () => {
              await generateSampleData();
            }}
          />
        </Card>
      ) : null}
    </ScrollView>
  );
}
