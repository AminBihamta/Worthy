import React, { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Card } from '../../components/Card';
import { SectionHeader } from '../../components/SectionHeader';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import {
  listSavingsBuckets,
  addSavingsContribution,
  archiveSavingsBucket,
} from '../../db/repositories/savings';
import { listWishlistItems, archiveWishlistItem } from '../../db/repositories/wishlist';
import { formatAmountInput, formatSigned, toMinor } from '../../utils/money';
import { Input } from '../../components/Input';
import { SwipeableRow } from '../../components/SwipeableRow';
import { useSettingsStore } from '../../state/useSettingsStore';

import { useTutorialTarget } from '../../components/tutorial/TutorialProvider';

export default function GoalsScreen() {
  const navigation = useNavigation();
  const { baseCurrency } = useSettingsStore();
  const [buckets, setBuckets] = useState<Awaited<ReturnType<typeof listSavingsBuckets>>>([]);
  const [wishlist, setWishlist] = useState<Awaited<ReturnType<typeof listWishlistItems>>>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const { ref: addRef, onLayout: onAddLayout } = useTutorialTarget('goals_add_button');

  const load = useCallback(() => {
    Promise.all([listSavingsBuckets(), listWishlistItems()]).then(([bucketsRows, wishlistRows]) => {
      setBuckets(bucketsRows);
      setWishlist(wishlistRows);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleAddContribution = async () => {
    if (!selectedBucketId) return;
    await addSavingsContribution({
      bucket_id: selectedBucketId,
      amount_minor: toMinor(amount),
      date_ts: Date.now(),
      notes,
    });
    setAmount('');
    setNotes('');
    setModalVisible(false);
    load();
  };

  return (
    <ScrollView
      className="flex-1 bg-app-bg dark:bg-app-bg-dark"
      contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
    >
      <SectionHeader
        title="Savings buckets"
        action={
          <View ref={addRef} onLayout={onAddLayout} collapsable={false}>
            <Button
              title="Add"
              variant="secondary"
              onPress={() => navigation.navigate('BucketForm' as never)}
            />
          </View>
        }
      />
      {buckets.length === 0 ? (
        <EmptyState
          title="No buckets yet"
          subtitle="Create a savings bucket to start building goals."
        />
      ) : (
        buckets.map((bucket) => {
          const progress = bucket.target_amount_minor
            ? Math.min(1, bucket.saved_minor / bucket.target_amount_minor)
            : 0;
          return (
            <View key={bucket.id} className="mb-4">
              <SwipeableRow
                onEdit={() => navigation.navigate('BucketForm' as never, { id: bucket.id } as never)}
                onDelete={async () => {
                  await archiveSavingsBucket(bucket.id);
                  load();
                }}
              >
                <Card>
                  <Text className="text-base font-display text-app-text dark:text-app-text-dark">
                    {bucket.name}
                  </Text>
                  <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-1">
                    {bucket.category_name}
                  </Text>
                  <Text className="text-xl font-display text-app-text dark:text-app-text-dark mt-3">
                    {formatSigned(bucket.saved_minor, baseCurrency)}
                  </Text>
                  {bucket.target_amount_minor ? (
                    <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
                      Target {formatSigned(bucket.target_amount_minor, baseCurrency)}
                    </Text>
                  ) : null}
                  {bucket.target_amount_minor ? (
                    <View className="h-2 rounded-full bg-app-soft dark:bg-app-soft-dark overflow-hidden mt-3">
                      <View
                        className="h-2 rounded-full"
                        style={{
                          width: `${progress * 100}%`,
                          backgroundColor: bucket.category_color,
                        }}
                      />
                    </View>
                  ) : null}
                  <View className="mt-4">
                    <Button
                      title="Add contribution"
                      variant="secondary"
                      onPress={() => {
                        setSelectedBucketId(bucket.id);
                        setModalVisible(true);
                      }}
                    />
                  </View>
                </Card>
              </SwipeableRow>
            </View>
          );
        })
      )}

      <SectionHeader
        title="Wishlist"
        action={
          <Button
            title="Add"
            variant="secondary"
            onPress={() => navigation.navigate('WishlistForm' as never)}
          />
        }
      />
      {wishlist.length === 0 ? (
        <EmptyState title="No wishlist items" subtitle="Add items to see what you can afford." />
      ) : (
        wishlist.map((item) => {
          const affordable = item.target_price_minor
            ? item.saved_minor >= item.target_price_minor
            : false;
          return (
            <View key={item.id} className="mb-4">
              <SwipeableRow
                onEdit={() =>
                  navigation.navigate('WishlistForm' as never, { id: item.id } as never)
                }
                onDelete={async () => {
                  await archiveWishlistItem(item.id);
                  load();
                }}
              >
                <Card
                  className={
                    affordable ? 'border-app-success/60 shadow-lg shadow-app-success/30' : ''
                  }
                >
                  <Text className="text-base font-display text-app-text dark:text-app-text-dark">
                    {item.title}
                  </Text>
                  <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-1">
                    {item.category_name}
                  </Text>
                  {item.target_price_minor ? (
                    <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-3">
                      Target {formatSigned(item.target_price_minor, baseCurrency)}
                    </Text>
                  ) : null}
                  <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-1">
                    Saved {formatSigned(item.saved_minor, baseCurrency)}
                  </Text>
                  <Text
                    className={`text-xs mt-2 ${affordable ? 'text-app-success' : 'text-app-muted dark:text-app-muted-dark'
                      }`}
                  >
                    {affordable ? 'Affordable now' : 'Keep saving to unlock'}
                  </Text>
                </Card>
              </SwipeableRow>
            </View>
          );
        })
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/40 justify-end">
          <View className="rounded-t-3xl bg-app-card dark:bg-app-card-dark p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-display text-app-text dark:text-app-text-dark">
                Add contribution
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text className="text-sm text-app-muted dark:text-app-muted-dark">Close</Text>
              </Pressable>
            </View>
            <Input
              label="Amount"
              value={amount}
              onChangeText={(value) => setAmount(formatAmountInput(value))}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
            <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" />
            <Button title="Save contribution" onPress={handleAddContribution} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
