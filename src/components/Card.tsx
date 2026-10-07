import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export function Card({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      className={`rounded-3xl border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-5 ${className}`}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
