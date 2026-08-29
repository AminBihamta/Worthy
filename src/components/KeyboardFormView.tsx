import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

/**
 * Wraps scrollable forms so the keyboard does not cover focused fields.
 * - iOS: padding + offset for stack header
 * - Android: relies on app.json softwareKeyboardLayoutMode "resize" (avoid behavior="height" with edge-to-edge)
 */
export function KeyboardFormView({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const headerHeight = useHeaderHeight();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      className={className}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
