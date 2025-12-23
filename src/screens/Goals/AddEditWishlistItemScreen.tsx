import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SelectField } from '../../components/SelectField';
import { listCategories } from '../../db/repositories/categories';
import { createWishlistItem } from '../../db/repositories/wishlist';
import { toMinor } from '../../utils/money';

export default function AddEditWishlistItemScreen() {
  const navigation = useNavigation();
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

  const handleSave = async () => {
    if (!categoryId) return;
    await createWishlistItem({
      category_id: categoryId,
      title,
      target_price_minor: target ? toMinor(target) : null,
      link: link || null,
      priority: priority ? Number.parseInt(priority, 10) : null,
    });
    navigation.goBack();
  };

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 20 }}
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
      <Button title="Save item" onPress={handleSave} />
    </ScrollView>
  );
}
