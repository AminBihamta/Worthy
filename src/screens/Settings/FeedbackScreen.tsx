import React from 'react';
import { Image, Linking, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/Button';

const FEEDBACK_URL = 'https://aminbihamta.com/forms/worthy-feedback';

export default function FeedbackScreen() {
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
            Feedback
          </Text>
          <Text className="text-base text-app-muted dark:text-app-muted-dark mt-2 text-center">
            Your voice shapes what Worthy becomes.
          </Text>
        </View>

        <View className="bg-app-card dark:bg-app-card-dark rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 p-6">
          <Text className="text-base text-app-text dark:text-app-text-dark leading-6">
            Worthy started as a personal tool — built quietly, for a real problem, without ads or
            data harvesting. Every thoughtful note from someone who uses it means more than you
            might think.
          </Text>
          <Text className="text-base text-app-text dark:text-app-text-dark leading-6 mt-4">
            If something delighted you, frustrated you, or is missing entirely, I would love to
            hear it. Your feedback is how this app grows into something that truly serves you.
          </Text>
          <Text className="text-base text-app-text dark:text-app-text-dark leading-6 mt-4">
            Thank you for being here, and for taking a moment to share.
          </Text>
        </View>

        <View className="mt-8">
          <Button
            title="Share your feedback"
            onPress={() => Linking.openURL(FEEDBACK_URL)}
            icon={(color) => <Feather name="heart" size={16} color={color} />}
          />
        </View>
      </ScrollView>
    </View>
  );
}
