import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import Slider from '@react-native-community/slider';
import { ColorPicker, fromHsv } from 'react-native-color-picker';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { createCategory, listCategories, updateCategory } from '../../db/repositories/categories';

const iconOptions: (keyof typeof Feather.glyphMap)[] = [
  'tag',
  'shopping-cart',
  'coffee',
  'home',
  'map',
  'film',
  'file-text',
  'repeat',
  'grid',
  'shopping-bag',
  'gift',
  'truck',
  'heart',
  'music',
  'book',
  'calendar',
  'airplay',
  'credit-card',
  'sun',
  'briefcase',
  'phone',
  'camera',
  'umbrella',
  'flag',
];

export default function AddEditCategoryScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconMuted = isDark ? '#8B949E' : '#6B7A8F';
  const route = useRoute();
  const params = route.params as { id?: string } | undefined;
  const editingId = params?.id;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');
  const [color, setColor] = useState('#0A9396');

  useEffect(() => {
    if (!editingId) return;
    listCategories(true).then((cats) => {
      const category = cats.find((cat) => cat.id === editingId);
      if (!category) return;
      setName(category.name);
      setIcon(category.icon);
      setColor(category.color);
    });
  }, [editingId]);

  const handleSave = async () => {
    if (editingId) {
      await updateCategory(editingId, { name, icon, color });
      navigation.goBack();
      return;
    }
    await createCategory({ name, icon, color });
    navigation.goBack();
  };

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
    >
      <View className="items-center mb-6">
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: `${color}1A` }}
        >
          <Feather name={icon as any} size={28} color={color} />
        </View>
        <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-2">
          Live preview
        </Text>
      </View>
      <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Grocery" />
      <View className="mb-6">
        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-3">
          Icon
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {iconOptions.map((iconName) => {
            const selected = iconName === icon;
            return (
              <Pressable
                key={iconName}
                onPress={() => setIcon(iconName)}
                className={`w-12 h-12 rounded-2xl items-center justify-center border ${
                  selected
                    ? 'border-app-brand dark:border-app-brand-dark bg-app-soft dark:bg-app-soft-dark'
                    : 'border-app-border dark:border-app-border-dark'
                }`}
              >
                <Feather
                  name={iconName}
                  size={20}
                  color={selected ? color : iconMuted}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
      <View className="mb-6">
        <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-3">
          Color
        </Text>
        <View className="rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 bg-app-card dark:bg-app-card-dark p-4">
          <ColorPicker
            color={color}
            onColorChange={(hsv) => setColor(fromHsv(hsv))}
            sliderComponent={Slider}
            style={{ height: 240, width: '100%' }}
          />
        </View>
      </View>
      <Button title={editingId ? 'Update category' : 'Save category'} onPress={handleSave} />
    </ScrollView>
  );
}
