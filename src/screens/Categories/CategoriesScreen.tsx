import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import {
  listCategories,
  reorderCategories,
  archiveCategory,
} from '../../db/repositories/categories';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { SwipeableRow } from '../../components/SwipeableRow';
import { EmptyState } from '../../components/EmptyState';

export default function CategoriesScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof listCategories>>>([]);

  const load = useCallback(() => {
    listCategories().then(setCategories);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const moveCategory = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;
    const next = [...categories];
    const temp = next[index];
    next[index] = next[newIndex];
    next[newIndex] = temp;
    setCategories(next);
    await reorderCategories(next.map((cat, idx) => ({ id: cat.id, sort_order: idx + 1 })));
  };

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 24 }}
    >
      {categories.length === 0 ? (
        <EmptyState title="No categories" subtitle="Add a category to organize spending." />
      ) : (
        categories.map((category, index) => (
          <View key={category.id} className="mb-4">
            <SwipeableRow
              onEdit={() =>
                navigation.navigate('CategoryForm' as never, { id: category.id } as never)
              }
              onDelete={async () => {
                await archiveCategory(category.id);
                load();
              }}
            >
              <Card className="flex-row items-center justify-between">
                <View>
                  <Text className="text-base font-display text-app-text dark:text-app-text-dark">
                    {category.name}
                  </Text>
                  <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
                    {category.icon}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Pressable
                    className="p-2"
                    onPress={() => moveCategory(index, -1)}
                    disabled={index === 0}
                  >
                    <Feather
                      name="chevron-up"
                      size={18}
                      color={index === 0 ? '#A2A7AF' : isDark ? '#F5F7FA' : '#101114'}
                    />
                  </Pressable>
                  <Pressable
                    className="p-2"
                    onPress={() => moveCategory(index, 1)}
                    disabled={index === categories.length - 1}
                  >
                    <Feather
                      name="chevron-down"
                      size={18}
                      color={
                        index === categories.length - 1 ? '#A2A7AF' : isDark ? '#F5F7FA' : '#101114'
                      }
                    />
                  </Pressable>
                </View>
              </Card>
            </SwipeableRow>
          </View>
        ))
      )}
      <Button title="Add category" onPress={() => navigation.navigate('CategoryForm' as never)} />
    </ScrollView>
  );
}
