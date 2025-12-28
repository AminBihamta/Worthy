import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';
import { Button } from '../../components/Button';
import { PressableScale } from '../../components/PressableScale';
import { Input } from '../../components/Input';
import { getDb } from '../../db';
import { createId } from '../../utils/id';
import { useSettingsStore } from '../../state/useSettingsStore';

type CategoryItem = {
    id: string;
    name: string;
    icon: keyof typeof Feather.glyphMap;
    color: string;
    is_default: number;
    type: 'expense' | 'income';
};

export default function CategorySetupScreen({ navigation }: { navigation: any }) {
    const { colorScheme } = useColorScheme();
    const palette = colorScheme === 'dark' ? colors.dark : colors.light;
    const insets = useSafeAreaInsets();
    const { completeOnboarding } = useSettingsStore();

    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // Minimal "add" mode
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const db = await getDb();
        const rows = await db.getAllAsync<any>('SELECT * FROM categories ORDER BY sort_order ASC');
        setCategories(rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            icon: r.icon,
            color: r.color,
            is_default: r.is_default,
            type: r.type,
        })));
    };

    const handleNext = async () => {
        // Complete onboarding immediately after categories
        // The user will then land on Home, where the Tutorial Overlay will trigger.
        await completeOnboarding();
    };

    const deleteCategory = async (id: string) => {
        const db = await getDb();
        await db.runAsync('DELETE FROM categories WHERE id = ?', id);
        loadCategories();
    };

    const startEdit = (cat: CategoryItem) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setIsAdding(false);
    };

    const saveEdit = async () => {
        if (!editingId || !editName.trim()) return;
        const db = await getDb();
        await db.runAsync('UPDATE categories SET name = ? WHERE id = ?', editName, editingId);
        setEditingId(null);
        setEditName('');
        loadCategories();
    };

    const addNewCategory = async () => {
        if (!newName.trim()) return;
        const db = await getDb();
        // Simple default icon/color for custom adds
        await db.runAsync(
            'INSERT INTO categories (id, name, icon, color, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            createId('cat_'),
            newName,
            'tag', // default icon
            '#6B7A8F', // default color
            categories.length + 1,
            Date.now()
        );
        setNewName('');
        setIsAdding(false);
        loadCategories();
    };

    const renderItem = ({ item }: { item: CategoryItem }) => {
        const isEditing = editingId === item.id;
        return (
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    backgroundColor: palette.surface,
                    borderRadius: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: palette.border,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: item.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Feather name={item.icon as any} size={20} color={item.color} />
                    </View>
                    {isEditing ? (
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            style={{
                                flex: 1,
                                fontFamily: 'Manrope_600SemiBold',
                                fontSize: 16,
                                color: palette.text,
                                borderBottomWidth: 1, borderColor: palette.brand
                            }}
                            autoFocus
                            onBlur={saveEdit}
                        />
                    ) : (
                        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 16, color: palette.text }}>
                            {item.name}
                        </Text>
                    )}
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                    {isEditing ? (
                        <PressableScale onPress={saveEdit}>
                            <Feather name="check" size={20} color={palette.success} />
                        </PressableScale>
                    ) : (
                        <PressableScale onPress={() => startEdit(item)}>
                            <Feather name="edit-2" size={18} color={palette.muted} />
                        </PressableScale>
                    )}
                    <PressableScale onPress={() => deleteCategory(item.id)}>
                        <Feather name="trash-2" size={18} color={palette.danger} />
                    </PressableScale>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: palette.bg }}>
            <View style={{ flex: 1, paddingHorizontal: 24 }}>
                <Text
                    style={{
                        fontFamily: 'Manrope_400Regular',
                        fontSize: 16,
                        color: palette.muted,
                        marginBottom: 24,
                        marginTop: 16,
                        lineHeight: 24,
                    }}
                >
                    Customize your categories. Tap edit to rename or trash to delete.
                </Text>

                {isAdding && (
                    <View style={{ marginBottom: 16 }}>
                        <Input
                            label="New Category Name"
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="e.g. Hobbies"
                            autoFocus
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 12 }}>
                            <Button title="Cancel" onPress={() => setIsAdding(false)} variant="ghost" />
                            <Button title="Add" onPress={addNewCategory} variant="primary" />
                        </View>
                    </View>
                )}

                <FlatList
                    data={categories}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />

                {!isAdding && (
                    <View style={{ marginTop: 12 }}>
                        <Button
                            title="+ Add Custom Category"
                            onPress={() => setIsAdding(true)}
                            variant="ghost"
                        />
                    </View>
                )}
            </View>

            <View style={{ padding: 24, paddingBottom: insets.bottom + 20, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
                <Button
                    title="Get Started"
                    onPress={handleNext}
                    variant="primary"
                />
            </View>
        </View>
    );
}
