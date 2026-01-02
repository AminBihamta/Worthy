import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

export default function PrivacyScreen() {
  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 140 }}>
        <View className="mb-6 items-center">
          <Image
            source={require('../../../assets/logo.png')}
            className="w-20 h-20 rounded-2xl mb-4"
            resizeMode="contain"
          />
          <Text className="text-4xl font-display text-app-text dark:text-app-text-dark">
            Privacy
          </Text>
          <Text className="text-base text-app-muted dark:text-app-muted-dark mt-2">
            Your data stays on your device.
          </Text>
        </View>

        <View className="bg-app-card dark:bg-app-card-dark rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 p-6">
          <Text className="text-base text-app-text dark:text-app-text-dark leading-6">
            Worthy is fully offline. It does not collect, transmit, or store your data on any
            server.
          </Text>
          <Text className="text-base text-app-text dark:text-app-text-dark leading-6 mt-4">
            This app was not developed with the goal of generating income but to gain experience and to solve a real-world problem I am facing.
          </Text>
          <Text className="text-base text-app-text dark:text-app-text-dark leading-6 mt-4">
            Everything stays on your device unless you choose to export it.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
