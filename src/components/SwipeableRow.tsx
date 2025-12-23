import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

function RightAction({
  progress,
  label,
  color,
  onPress,
}: {
  progress: SharedValue<number>;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.8, 1]);
    const opacity = interpolate(progress.value, [0, 1], [0.3, 1]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[{ width: 80, justifyContent: 'center', alignItems: 'center' }, style]}>
      <Pressable
        onPress={onPress}
        className="h-12 w-16 items-center justify-center rounded-xl"
        style={{ backgroundColor: color }}
      >
        <Text className="text-xs font-semibold text-white">{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function SwipeableRow({
  children,
  onDelete,
  onEdit,
}: {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  return (
    <Swipeable
      renderRightActions={(progress) => (
        <View className="flex-row items-center pr-2">
          {onEdit ? (
            <RightAction progress={progress} label="Edit" color="#2F6F62" onPress={onEdit} />
          ) : null}
          {onDelete ? (
            <RightAction progress={progress} label="Delete" color="#D64545" onPress={onDelete} />
          ) : null}
        </View>
      )}
    >
      {children}
    </Swipeable>
  );
}
