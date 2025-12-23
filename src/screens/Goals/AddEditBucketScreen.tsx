import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SelectField } from '../../components/SelectField';
import { listCategories } from '../../db/repositories/categories';
import { createSavingsBucket } from '../../db/repositories/savings';
import { toMinor } from '../../utils/money';

export default function AddEditBucketScreen() {
  const navigation = useNavigation();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    listCategories().then((cats) => {
      setCategories(cats.map((cat) => ({ id: cat.id, name: cat.name })));
      if (!categoryId && cats.length > 0) setCategoryId(cats[0].id);
    });
  }, [categoryId]);

  const handleSave = async () => {
    if (!categoryId) return;
    await createSavingsBucket({
      category_id: categoryId,
      name,
      target_amount_minor: target ? toMinor(target) : null,
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
      <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Summer Trip" />
      <Input
        label="Target amount"
        value={target}
        onChangeText={setTarget}
        placeholder="Optional"
        keyboardType="decimal-pad"
      />
      <Button title="Save bucket" onPress={handleSave} />
    </ScrollView>
  );
}
