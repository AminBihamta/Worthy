import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const animateTo = (value: number) => {
    scale.value = withSpring(value, {
      damping: 15,
      stiffness: 400,
    });
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
      <Animated.View style={animatedStyle} className={className}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
