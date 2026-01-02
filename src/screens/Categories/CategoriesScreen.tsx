import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import {
  listCategories,
  reorderCategories,
  archiveCategory,
} from '../../db/repositories/categories';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';

export default function CategoriesScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#E6EDF3' : '#0D1B2A';
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof listCategories>>>([]);

  const load = useCallback(() => {
    listCategories().then(setCategories);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleReorder = async (next: typeof categories) => {
    setCategories(next);
    await reorderCategories(next.map((cat, idx) => ({ id: cat.id, sort_order: idx + 1 })));
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<typeof categories[number]>) => {
    const iconTint = item.color ?? iconColor;
    return (
      <View className="mb-4">
        <Card className={isActive ? 'border-app-brand/40 bg-app-soft dark:bg-app-soft-dark' : ''}>
          <View className="flex-row items-center">
            <Pressable
              onLongPress={drag}
              className="mr-4"
              accessibilityLabel="Drag to reorder"
            >
              <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                <Feather name="menu" size={18} color={iconColor} />
              </View>
            </Pressable>
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: `${iconTint}1A` }}
            >
              <Feather name={item.icon as any} size={18} color={iconTint} />
            </View>
            <View className="flex-1 pr-4">
              <Text className="text-base font-display text-app-text dark:text-app-text-dark">
                {item.name}
              </Text>
            </View>
            <View className="items-end gap-2">
              <Pressable
                className="px-3 py-1.5 rounded-full border border-app-border dark:border-app-border-dark bg-app-soft dark:bg-app-soft-dark flex-row items-center"
                onPress={() =>
                  navigation.navigate('CategoryForm' as never, { id: item.id } as never)
                }
              >
                <Feather name="edit-2" size={14} color={iconColor} />
                <Text className="text-xs text-app-text dark:text-app-text-dark ml-1.5">
                  Edit
                </Text>
              </Pressable>
              <Pressable
                className="px-3 py-1.5 rounded-full border border-app-danger/30 bg-app-danger/10 flex-row items-center"
                onPress={async () => {
                  await archiveCategory(item.id);
                  load();
                }}
              >
                <Feather name="trash-2" size={14} color="#EF4444" />
                <Text className="text-xs text-app-danger ml-1.5">Delete</Text>
              </Pressable>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <DraggableFlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => {
          handleReorder(data);
        }}
        contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
        ListEmptyComponent={
          <EmptyState title="No categories" subtitle="Add a category to organize spending." />
        }
        ListFooterComponent={
          <View className="mt-2">
            <Button title="Add category" onPress={() => navigation.navigate('CategoryForm' as never)} />
          </View>
        }
      />
    </View>
  );
}
