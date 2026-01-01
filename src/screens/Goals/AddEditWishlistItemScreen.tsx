import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SelectField } from '../../components/SelectField';
import { listCategories } from '../../db/repositories/categories';
import { archiveWishlistItem, createWishlistItem, listWishlistItems, updateWishlistItem } from '../../db/repositories/wishlist';
import { toMinor } from '../../utils/money';

export default function AddEditWishlistItemScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { id?: string } | undefined;
  const editingId = params?.id;
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [link, setLink] = useState('');
  const [priority, setPriority] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    listCategories().then((cats) => {
      setCategories(cats.map((cat) => ({ id: cat.id, name: cat.name })));
      if (!categoryId && cats.length > 0) setCategoryId(cats[0].id);
    });
  }, [categoryId]);

  useEffect(() => {
    if (!editingId) return;
    navigation.setOptions({ title: 'Edit Wishlist Item' });
    listWishlistItems().then((items) => {
      const item = items.find((row) => row.id === editingId);
      if (!item) return;
      setCategoryId(item.category_id);
      setTitle(item.title);
      setTarget(item.target_price_minor ? String(item.target_price_minor / 100) : '');
      setLink(item.link ?? '');
      setPriority(item.priority ? String(item.priority) : '');
    });
  }, [editingId, navigation]);

  const handleSave = async () => {
    if (!categoryId) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Title required', 'Please add a title for this wishlist item.');
      return;
    }
    if (editingId) {
      await updateWishlistItem(editingId, {
        category_id: categoryId,
        title: trimmedTitle,
        target_price_minor: target ? toMinor(target) : null,
        link: link || null,
        priority: priority ? Number.parseInt(priority, 10) : null,
      });
      navigation.goBack();
      return;
    }
    await createWishlistItem({
      category_id: categoryId,
      title: trimmedTitle,
      target_price_minor: target ? toMinor(target) : null,
      link: link || null,
      priority: priority ? Number.parseInt(priority, 10) : null,
    });
    navigation.goBack();
  };

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
    >
      <SelectField
        label="Category"
        value={categoryId}
        options={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
        onChange={setCategoryId}
      />
      <Input label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Headphones" />
      <Input
        label="Target price"
        value={target}
        onChangeText={setTarget}
        placeholder="Optional"
        keyboardType="decimal-pad"
      />
      <Input label="Link" value={link} onChangeText={setLink} placeholder="Optional" />
      <Input
        label="Priority"
        value={priority}
        onChangeText={setPriority}
        placeholder="Optional"
        keyboardType="numeric"
      />
      <Button title={editingId ? 'Update item' : 'Save item'} onPress={handleSave} />
      {editingId ? (
        <View className="mt-3">
          <Button
            title="Delete item"
            variant="danger"
            onPress={() => {
              Alert.alert('Delete wishlist item?', 'This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await archiveWishlistItem(editingId);
                    navigation.goBack();
                  },
                },
              ]);
            }}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
