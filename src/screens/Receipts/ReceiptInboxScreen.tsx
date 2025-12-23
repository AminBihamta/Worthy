import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import {
  createReceiptInboxItem,
  deleteReceiptInboxItem,
  listReceiptInbox,
  updateReceiptInbox,
} from '../../db/repositories/receipts';
import { createId } from '../../utils/id';
import { formatDate } from '../../utils/time';

const receiptDir = `${FileSystem.documentDirectory}receipts`;

export default function ReceiptInboxScreen() {
  const navigation = useNavigation();
  const [receipts, setReceipts] = useState<Awaited<ReturnType<typeof listReceiptInbox>>>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    listReceiptInbox('pending').then(setReceipts);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const ensureDir = async () => {
    const dirInfo = await FileSystem.getInfoAsync(receiptDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(receiptDir, { intermediates: true });
    }
  };

  const handleCapture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    await ensureDir();
    const asset = result.assets[0];
    const fileName = `${createId('rcpt_')}.jpg`;
    const target = `${receiptDir}/${fileName}`;
    await FileSystem.copyAsync({ from: asset.uri, to: target });
    await createReceiptInboxItem({ image_uri: target });
    load();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBatchDelete = async () => {
    await Promise.all(Array.from(selected).map((id) => deleteReceiptInboxItem(id)));
    setSelected(new Set());
    load();
  };

  const handleBatchDone = async () => {
    await Promise.all(
      Array.from(selected).map((id) => updateReceiptInbox(id, { status: 'processed' })),
    );
    setSelected(new Set());
    load();
  };

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Button
          title="Quick add receipt"
          onPress={handleCapture}
          icon={<Feather name="camera" size={16} color="#FFFFFF" />}
        />
        <View className="mt-6">
          {receipts.length === 0 ? (
            <EmptyState title="Inbox is empty" subtitle="Add a receipt photo to capture later." />
          ) : (
            receipts.map((item) => (
              <Pressable key={item.id} onPress={() => toggleSelect(item.id)} className="mb-4">
                <Card>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm text-app-muted dark:text-app-muted-dark">
                      {formatDate(item.created_at)}
                    </Text>
                    <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                      {selected.has(item.id) ? 'Selected' : 'Tap to select'}
                    </Text>
                  </View>
                  <Image
                    source={{ uri: item.image_uri }}
                    style={{ width: '100%', height: 180, borderRadius: 16 }}
                    resizeMode="cover"
                  />
                  <View className="flex-row items-center justify-between mt-4">
                    <Button
                      title="Convert to expense"
                      variant="secondary"
                      onPress={() =>
                        navigation.navigate('AddExpense' as never, { receiptId: item.id } as never)
                      }
                    />
                    <Pressable onPress={() => deleteReceiptInboxItem(item.id).then(load)}>
                      <Text className="text-sm text-app-danger">Delete</Text>
                    </Pressable>
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {selected.size > 0 ? (
        <View className="absolute bottom-6 left-6 right-6 rounded-2xl border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-4 flex-row items-center justify-between">
          <Text className="text-sm text-app-text dark:text-app-text-dark">
            {selected.size} selected
          </Text>
          <View className="flex-row items-center">
            <Pressable className="mr-4" onPress={handleBatchDone}>
              <Text className="text-sm text-app-brand">Mark done</Text>
            </Pressable>
            <Pressable onPress={handleBatchDelete}>
              <Text className="text-sm text-app-danger">Delete</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
