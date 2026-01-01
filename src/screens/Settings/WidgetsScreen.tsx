import React from 'react';
import { ScrollView, Text } from 'react-native';
import { Card } from '../../components/Card';

export default function WidgetsScreen() {
  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
    >
      <Card>
        <Text className="text-lg font-display text-app-text dark:text-app-text-dark mb-2">
          Widgets are coming soon
        </Text>
        <Text className="text-sm text-app-muted dark:text-app-muted-dark">
          We are preparing native widgets for quick add and insights. For now, use the in-app quick
          add buttons on Home and Transactions.
        </Text>
      </Card>
    </ScrollView>
  );
}
