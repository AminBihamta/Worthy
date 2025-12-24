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
      className={`rounded-3xl border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-5 ${className}`}
    >
      {children}
    </View>
  );
}
