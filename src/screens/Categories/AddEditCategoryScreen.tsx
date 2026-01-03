import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
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

const fallbackColors = [
  '#0A9396',
  '#94D2BD',
  '#E9D8A6',
  '#EE9B00',
  '#CA6702',
  '#BB3E03',
  '#AE2012',
  '#9B2226',
  '#264653',
  '#2A9D8F',
  '#E76F51',
  '#6C63FF',
];

class ColorPickerErrorBoundary extends React.PureComponent<
  { fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function ColorPalette({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (color: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {fallbackColors.map((swatch) => {
        const selected = swatch.toLowerCase() === value.toLowerCase();
        return (
          <Pressable
            key={swatch}
            onPress={() => onSelect(swatch)}
            className={`w-12 h-12 rounded-2xl items-center justify-center border ${
              selected
                ? 'border-app-brand dark:border-app-brand-dark bg-app-soft dark:bg-app-soft-dark'
                : 'border-app-border dark:border-app-border-dark'
            }`}
          >
            <View className="w-8 h-8 rounded-full" style={{ backgroundColor: swatch }} />
          </Pressable>
        );
      })}
    </View>
  );
}

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
          className="w-16 h-16 rounded-full items-center justify-center overflow-hidden"
        >
          <View className="absolute inset-0" style={{ backgroundColor: color, opacity: 0.12 }} />
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
          <ColorPickerErrorBoundary
            fallback={<ColorPalette value={color} onSelect={setColor} />}
          >
            <ColorPicker
              color={color}
              onColorChange={(hsv) => setColor(fromHsv(hsv))}
              sliderComponent={Platform.OS === 'ios' ? Slider : undefined}
              hideSliders={Platform.OS === 'android'}
              style={{ height: 240, width: '100%' }}
            />
          </ColorPickerErrorBoundary>
        </View>
      </View>
      <Button title={editingId ? 'Update category' : 'Save category'} onPress={handleSave} />
    </ScrollView>
  );
}
