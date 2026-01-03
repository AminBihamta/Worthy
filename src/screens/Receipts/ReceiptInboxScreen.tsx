import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PressableScale } from '../../components/PressableScale';
import {
  createReceiptInboxItem,
  deleteReceiptInboxItem,
  listReceiptInbox,
  updateReceiptInbox,
} from '../../db/repositories/receipts';
import { listRecentUnlinkedExpenses } from '../../db/repositories/expenses';
import { getSetting, setSetting } from '../../db/repositories/settings';
import { createId } from '../../utils/id';
import { formatDate } from '../../utils/time';
import { extractReceiptSuggestions } from '../../utils/receiptOcr';
import { formatMinor } from '../../utils/money';
import { useSettingsStore } from '../../state/useSettingsStore';

const receiptDir = `${FileSystem.documentDirectory}receipts`;

export default function ReceiptInboxScreen() {
  const navigation = useNavigation();
  const { baseCurrency } = useSettingsStore();
  const [receipts, setReceipts] = useState<Awaited<ReturnType<typeof listReceiptInbox>>>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [recentExpenses, setRecentExpenses] = useState<
    Awaited<ReturnType<typeof listRecentUnlinkedExpenses>>
  >([]);
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(() => {
    listReceiptInbox('pending').then(setReceipts);
    listRecentUnlinkedExpenses(4).then(setRecentExpenses);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      getSetting('quick_capture_ocr_enabled').then((value) => {
        setOcrEnabled(value === 'true');
      });
    }, [load]),
  );

  const ensureDir = async () => {
    const dirInfo = await FileSystem.getInfoAsync(receiptDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(receiptDir, { intermediates: true });
    }
  };

  const createReceiptFromAsset = async (uri: string) => {
    await ensureDir();
    const fileName = `${createId('rcpt_')}.jpg`;
    const target = `${receiptDir}/${fileName}`;
    let storedUri = uri;
    try {
      await FileSystem.copyAsync({ from: uri, to: target });
      storedUri = target;
    } catch (error) {
      try {
        await FileSystem.moveAsync({ from: uri, to: target });
        storedUri = target;
      } catch (moveError) {
        storedUri = uri;
      }
    }

    let suggestions = {};
    if (ocrEnabled) {
      try {
        suggestions = await extractReceiptSuggestions(storedUri);
      } catch (error) {
        suggestions = {};
      }
    }
    await createReceiptInboxItem({ image_uri: storedUri, ...suggestions });
  };

  const handleCapture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    const asset = result.assets?.[0];
    if (result.canceled || !asset?.uri) return;

    setProcessing(true);
    try {
      await createReceiptFromAsset(asset.uri);
      load();
    } finally {
      setProcessing(false);
    }
  };

  const handleImport = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (result.canceled || !result.assets?.length) return;

    setProcessing(true);
    try {
      for (const asset of result.assets) {
        if (asset.uri) {
          await createReceiptFromAsset(asset.uri);
        }
      }
      load();
    } finally {
      setProcessing(false);
    }
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

  const handleLinkExpense = async (receiptId: string, expenseId: string) => {
    await updateReceiptInbox(receiptId, { status: 'processed', linked_expense_id: expenseId });
    load();
  };

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 140 }}>
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-sm font-medium text-app-text dark:text-app-text-dark">
              Offline OCR
            </Text>
            <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
              Auto-extract receipt details on device.
            </Text>
          </View>
          <Switch
            value={ocrEnabled}
            onValueChange={async (value) => {
              setOcrEnabled(value);
              await setSetting('quick_capture_ocr_enabled', value ? 'true' : 'false');
            }}
          />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              title={processing ? 'Capturing...' : 'Capture'}
              onPress={handleCapture}
              icon={(color) => <Feather name="camera" size={16} color={color} />}
              disabled={processing}
            />
          </View>
          <View className="flex-1">
            <Button
              title={processing ? 'Importing...' : 'Import'}
              variant="secondary"
              onPress={handleImport}
              icon={(color) => <Feather name="image" size={16} color={color} />}
              disabled={processing}
            />
          </View>
        </View>
        <View className="mt-6">
          {receipts.length === 0 ? (
            <EmptyState title="No captures yet" subtitle="Add a quick capture to log later." />
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
                    style={{ width: '100%', height: 180, borderRadius: 24 }}
                    resizeMode="cover"
                  />
                  {item.suggested_title || item.suggested_amount_minor || item.suggested_date_ts ? (
                    <View className="mt-3 rounded-2xl border border-app-border/50 dark:border-app-border-dark/50 bg-app-soft dark:bg-app-soft-dark p-3">
                      <Text className="text-[11px] uppercase tracking-widest text-app-muted dark:text-app-muted-dark">
                        Detected
                      </Text>
                      <View className="mt-2 space-y-1">
                        {item.suggested_title ? (
                          <Text className="text-sm text-app-text dark:text-app-text-dark">
                            {item.suggested_title}
                          </Text>
                        ) : null}
                        {item.suggested_amount_minor ? (
                          <Text className="text-sm text-app-text dark:text-app-text-dark">
                            {formatMinor(item.suggested_amount_minor, baseCurrency)}
                          </Text>
                        ) : null}
                        {item.suggested_date_ts ? (
                          <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                            {formatDate(item.suggested_date_ts)}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                  {recentExpenses.length > 0 ? (
                    <View className="mt-4">
                      <Text className="text-[11px] uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-2">
                        Suggested matches
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {recentExpenses.map((expense) => (
                          <PressableScale
                            key={expense.id}
                            onPress={() => handleLinkExpense(item.id, expense.id)}
                            className="px-3 py-2 rounded-full border border-app-border/60 dark:border-app-border-dark/60 bg-app-card dark:bg-app-card-dark"
                          >
                            <Text className="text-xs text-app-text dark:text-app-text-dark">
                              {expense.title}
                            </Text>
                          </PressableScale>
                        ))}
                      </View>
                    </View>
                  ) : null}
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
        <View className="absolute bottom-6 left-6 right-6 rounded-3xl border border-app-border dark:border-app-border-dark bg-app-card dark:bg-app-card-dark p-4 flex-row items-center justify-between">
          <Text className="text-sm text-app-text dark:text-app-text-dark">
            {selected.size} selected
          </Text>
          <View className="flex-row items-center">
            <Pressable className="mr-4" onPress={handleBatchDone}>
              <Text className="text-sm text-app-success">Mark done</Text>
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
