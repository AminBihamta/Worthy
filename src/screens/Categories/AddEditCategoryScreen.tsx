import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { SelectField } from '../../components/SelectField';
import { createCategory, listCategories, updateCategory } from '../../db/repositories/categories';

const colorOptions = [
  { label: 'Teal', value: '#0A9396' },
  { label: 'Amber', value: '#EE9B00' },
  { label: 'Ocean', value: '#005F73' },
  { label: 'Forest', value: '#38B000' },
  { label: 'Coral', value: '#D62828' },
  { label: 'Gold', value: '#FFB703' },
  { label: 'Slate', value: '#6B7A8F' },
];

export default function AddEditCategoryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { id?: string } | undefined;
  const editingId = params?.id;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');
  const [color, setColor] = useState(colorOptions[0].value);

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
      <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Grocery" />
      <Input label="Icon" value={icon} onChangeText={setIcon} placeholder="Feather icon name" />
      <SelectField label="Color" value={color} options={colorOptions} onChange={setColor} />
      <Button title={editingId ? 'Update category' : 'Save category'} onPress={handleSave} />
    </ScrollView>
  );
}
