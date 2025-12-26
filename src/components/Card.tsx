import React from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      className={`rounded-3xl border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-5 ${className}`}
    >
      {children}
    </Animated.View>
  );
}
