import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

export function PressableScale({
  children,
  onPress,
  className,
  haptic = false,
  ...props
}: PressableProps & {
  className?: string;
  children: React.ReactNode;
  haptic?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.timing(scale, {
      toValue: value,
      duration: 140,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={() => animateTo(0.97)}
      onPressOut={() => animateTo(1)}
      onPress={async (event) => {
        if (haptic) {
          await Haptics.selectionAsync();
        }
        onPress?.(event);
      }}
      {...props}
    >
      <Animated.View style={{ transform: [{ scale }] }} className={className}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
