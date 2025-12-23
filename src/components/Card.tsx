import React from 'react';
import { View } from 'react-native';

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`rounded-2xl border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-4 ${className}`}
    >
      {children}
    </View>
  );
}
