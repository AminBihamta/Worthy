import React, { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Text } from 'react-native';

export function AnimatedNumber({ value, className }: { value: string; className?: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 300 });
  }, [value, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.98 + progress.value * 0.02 }],
  }));

  return (
    <Animated.View style={style}>
      <Text className={className}>{value}</Text>
    </Animated.View>
  );
}
