import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PressableScale } from '../../components/PressableScale';
import { SwipeableRow } from '../../components/SwipeableRow';
import { useSettingsStore } from '../../state/useSettingsStore';
import {
    archiveCurrency,
    listCurrencies,
    upsertCurrency,
    CurrencyRow,
} from '../../db/repositories/currencies';
import { colors } from '../../theme/tokens';

interface SelectionModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: { id: string; name: string; subtitle?: string }[];
    onSelect: (id: string) => void;
    selectedId: string | null;
}

function SelectionModal({ visible, onClose, title, options, onSelect, selectedId }: SelectionModalProps) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <Pressable className="flex-1 bg-black/60" onPress={onClose}>
                <View className="flex-1 justify-end">
                    <Pressable className="bg-app-card dark:bg-app-card-dark rounded-t-[32px] overflow-hidden max-h-[75%]">
                        <View className="items-center pt-4 pb-2">
                            <View className="w-12 h-1.5 rounded-full bg-app-border dark:bg-app-border-dark" />
                        </View>
                        <View className="px-6 py-4 border-b border-app-border/50 dark:border-app-border-dark/50 flex-row justify-between items-center">
                            <Text className="text-xl font-display text-app-text dark:text-app-text-dark">
                                {title}
                            </Text>
                            <Pressable onPress={onClose} className="p-2 -mr-2">
                                <Feather name="x" size={24} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                            </Pressable>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 24 }}>
                            {options.map((option) => (
                                <PressableScale
                                    key={option.id}
                                    className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl border ${selectedId === option.id
                                            ? 'bg-app-soft dark:bg-app-soft-dark border-app-brand dark:border-app-brand-dark'
                                            : 'bg-transparent border-app-border dark:border-app-border-dark'
                                        }`}
                                    onPress={() => {
                                        onSelect(option.id);
                                        onClose();
                                    }}
                                >
                                    <View>
                                        <Text
                                            className={`text-base font-medium ${selectedId === option.id
                                                    ? 'text-app-brand dark:text-app-brand-dark'
                                                    : 'text-app-text dark:text-app-text-dark'
                                                }`}
                                        >
                                            {option.name}
                                        </Text>
                                        {option.subtitle ? (
                                            <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-0.5">
                                                {option.subtitle}
                                            </Text>
                                        ) : null}
                                    </View>
                                    {selectedId === option.id ? (
                                        <Feather name="check" size={20} color={isDark ? '#58D5D8' : '#0A9396'} />
                                    ) : null}
                                </PressableScale>
                            ))}
                        </ScrollView>
                    </Pressable>
                </View>
            </Pressable>
        </Modal>
    );
}

export default function WelcomeScreen({ navigation }: { navigation: any }) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const palette = colorScheme === 'dark' ? colors.dark : colors.light;
    const insets = useSafeAreaInsets();

    const { baseCurrency, setBaseCurrency } = useSettingsStore();
    const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);

    // Modal states
    const [showBaseModal, setShowBaseModal] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);

    // Form states
    const [editing, setEditing] = useState<CurrencyRow | null>(null);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [rate, setRate] = useState('');
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        const items = await listCurrencies();
        setCurrencies(items);
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    useEffect(() => {
        if (!showFormModal) {
            setError(null);
        }
    }, [showFormModal]);

    const baseCurrencyRow = useMemo(
        () => currencies.find((currency) => currency.code === baseCurrency),
        [currencies, baseCurrency]
    );

    const baseOptions = currencies.map((currency) => ({
        id: currency.code,
        name: `${currency.code} · ${currency.name}`,
    }));

    const openAdd = () => {
        setEditing(null);
        setCode('');
        setName('');
        setSymbol('');
        setRate('');
        setShowFormModal(true);
    };

    const openEdit = (currency: CurrencyRow) => {
        setEditing(currency);
        setCode(currency.code);
        setName(currency.name);
        setSymbol(currency.symbol ?? '');
        setRate(String(currency.rate_to_base));
        setShowFormModal(true);
    };

    const handleSave = async () => {
        const trimmedCode = code.trim().toUpperCase();
        const trimmedName = name.trim();
        const parsedRate = Number.parseFloat(rate);

        if (!trimmedCode || !trimmedName || Number.isNaN(parsedRate) || parsedRate <= 0) {
            setError('Enter a currency code, name, and valid conversion rate.');
            return;
        }

        const finalRate = trimmedCode === baseCurrency ? 1 : parsedRate;

        await upsertCurrency({
            code: trimmedCode,
            name: trimmedName,
            symbol: symbol.trim() || null,
            rate_to_base: finalRate,
        });

        // If we just edited the base currency's rate (which shouldn't happen, but just in case)
        // or if we switched base currency logic elsewhere, verify consistency.
        // Here we just save.

        // If the user adds a new currency that matches base (edge case), ensure rate is 1.
        if (trimmedCode === baseCurrency) {
            // logic handled above by force setting rate to 1
        }

        setShowFormModal(false);
        load();
    };

    const handleSetBase = async (codeValue: string) => {
        const normalized = codeValue.toUpperCase();
        await setBaseCurrency(normalized);
        const existing = currencies.find((currency) => currency.code === normalized);
        if (existing) {
            await upsertCurrency({
                code: normalized,
                name: existing.name,
                symbol: existing.symbol,
                rate_to_base: 1,
            });
        }
        Haptics.selectionAsync();
        load();
    };

    const handleNext = () => {
        if (!baseCurrency) {
            Alert.alert('Selection Required', 'Please select a base currency to continue.');
            return;
        }
        navigation.navigate('AccountsSetup');
    };

    return (
        <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingHorizontal: 24,
                    paddingTop: insets.top + 20,
                    paddingBottom: insets.bottom + 100
                }}
                showsVerticalScrollIndicator={false}
            >
                <View className="mb-8">
                    <Text className="text-4xl font-display font-bold text-app-text dark:text-app-text-dark mb-4">
                        Welcome to Worthy
                    </Text>
                    <Text className="text-base text-app-muted dark:text-app-muted-dark leading-6">
                        Let's get you set up. First, choose your primary currency for tracking your wealth.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-xs uppercase tracking-widest text-app-muted dark:text-app-muted-dark mb-4 pl-1">
                        Base currency
                    </Text>
                    <Card>
                        <PressableScale
                            onPress={() => setShowBaseModal(true)}
                            haptic
                        >
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-xl font-display text-app-text dark:text-app-text-dark">
                                        {baseCurrencyRow ? baseCurrencyRow.code : baseCurrency}
                                    </Text>
                                    <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-1">
                                        {baseCurrencyRow?.name ?? 'Default reporting currency'}
                                    </Text>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <View className="px-3 py-1 rounded-full bg-app-soft dark:bg-app-soft-dark">
                                        <Text className="text-xs text-app-text dark:text-app-text-dark">Selected</Text>
                                    </View>
                                    <Feather name="chevron-right" size={18} color={isDark ? '#8B949E' : '#6B7A8F'} />
                                </View>
                            </View>
                        </PressableScale>
                    </Card>
                </View>

                <View className="flex-row items-center justify-between mb-4 pl-1">
                    <Text className="text-lg font-display text-app-text dark:text-app-text-dark">
                        Custom currencies
                    </Text>
                    <PressableScale onPress={openAdd} haptic>
                        <View className="flex-row items-center gap-2 px-3 py-2 rounded-full bg-app-soft dark:bg-app-soft-dark">
                            <Feather name="plus" size={16} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                            <Text className="text-sm text-app-text dark:text-app-text-dark">Add</Text>
                        </View>
                    </PressableScale>
                </View>

                {currencies.length === 0 ? (
                    <Card>
                        <Text className="text-sm text-app-muted dark:text-app-muted-dark">
                            Add your first currency to get started.
                        </Text>
                    </Card>
                ) : (
                    currencies.map((currency) => {
                        const isBase = currency.code === baseCurrency;
                        const rateLabel = isBase
                            ? '1.00 (base)'
                            : `1 ${currency.code} = ${currency.rate_to_base.toFixed(4)} ${baseCurrency}`;

                        // Do not show base currency in the custom list to reduce clutter? 
                        // The screenshot showed "Base Currency" card at top, and then "Custom currencies" list below.
                        // Usually base currency is also in the list but marked. Let's keep it to be consistent with CurrenciesScreen.
                        // Actually, for onboarding, maybe we only want to show non-base custom ones?
                        // "Custom currencies" implies ones added by user.
                        // But if I hide base, I can't edit it.
                        // The logic in CurrenciesScreen shows ALL.
                        // I'll show all.

                        return (
                            <View key={currency.code} className="mb-4">
                                <SwipeableRow
                                    onEdit={() => openEdit(currency)}
                                    onDelete={
                                        isBase
                                            ? undefined
                                            : async () => {
                                                await archiveCurrency(currency.code);
                                                load();
                                            }
                                    }
                                >
                                    <Card>
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-row items-center gap-4">
                                                <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                                                    <Feather name="globe" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                                                </View>
                                                <View>
                                                    <Text className="text-base font-display text-app-text dark:text-app-text-dark">
                                                        {currency.code}
                                                    </Text>
                                                    <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
                                                        {currency.name}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className="items-end">
                                                <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                                                    {rateLabel}
                                                </Text>
                                                {isBase ? (
                                                    <Text className="text-xs text-app-brand dark:text-app-brand-dark mt-1">
                                                        Base currency
                                                    </Text>
                                                ) : null}
                                            </View>
                                        </View>
                                    </Card>
                                </SwipeableRow>
                            </View>
                        );
                    })
                )}

                <View className="h-20" />
            </ScrollView>

            {/* Footer */}
            <View
                style={{ paddingBottom: insets.bottom + 20 }}
                className="absolute bottom-0 left-0 right-0 bg-app-bg dark:bg-app-bg-dark border-t border-app-border dark:border-app-border-dark px-6 pt-4"
            >
                <Button
                    title="Continue"
                    onPress={handleNext}
                    variant="primary"
                />
            </View>

            <SelectionModal
                visible={showBaseModal}
                onClose={() => setShowBaseModal(false)}
                title="Base currency"
                options={baseOptions}
                onSelect={handleSetBase}
                selectedId={baseCurrency}
            />

            <Modal
                visible={showFormModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFormModal(false)}
            >
                <Pressable className="flex-1 bg-black/60" onPress={() => setShowFormModal(false)}>
                    <View className="flex-1 justify-end">
                        <Pressable className="bg-app-card dark:bg-app-card-dark rounded-t-[32px] overflow-hidden">
                            <View className="items-center pt-4 pb-2">
                                <View className="w-12 h-1.5 rounded-full bg-app-border dark:bg-app-border-dark" />
                            </View>
                            <View className="px-6 py-4 border-b border-app-border/50 dark:border-app-border-dark/50 flex-row justify-between items-center">
                                <Text className="text-xl font-display text-app-text dark:text-app-text-dark">
                                    {editing ? 'Edit currency' : 'Add currency'}
                                </Text>
                                <Pressable onPress={() => setShowFormModal(false)} className="p-2 -mr-2">
                                    <Feather name="x" size={24} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                                </Pressable>
                            </View>
                            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
                                <View className="bg-app-card dark:bg-app-card-dark rounded-3xl border border-app-border/50 dark:border-app-border-dark/50 overflow-hidden">
                                    <View className="flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30">
                                        <View className="flex-row items-center gap-4">
                                            <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                                                <Feather name="type" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                                            </View>
                                            <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Code</Text>
                                        </View>
                                        <TextInput
                                            value={code}
                                            onChangeText={setCode}
                                            placeholder="USD"
                                            placeholderTextColor={isDark ? '#8B949E' : '#6B7A8F'}
                                            autoCapitalize="characters"
                                            className="text-base text-app-text dark:text-app-text-dark text-right min-w-[80px]"
                                            editable={!editing}
                                        />
                                    </View>

                                    <View className="flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30">
                                        <View className="flex-row items-center gap-4">
                                            <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                                                <Feather name="edit-2" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                                            </View>
                                            <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Name</Text>
                                        </View>
                                        <TextInput
                                            value={name}
                                            onChangeText={setName}
                                            placeholder="US Dollar"
                                            placeholderTextColor={isDark ? '#8B949E' : '#6B7A8F'}
                                            className="text-base text-app-text dark:text-app-text-dark text-right min-w-[140px]"
                                        />
                                    </View>

                                    <View className="flex-row items-center justify-between p-5 border-b border-app-border/30 dark:border-app-border-dark/30">
                                        <View className="flex-row items-center gap-4">
                                            <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                                                <Feather name="hash" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                                            </View>
                                            <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Symbol</Text>
                                        </View>
                                        <TextInput
                                            value={symbol}
                                            onChangeText={setSymbol}
                                            placeholder="$"
                                            placeholderTextColor={isDark ? '#8B949E' : '#6B7A8F'}
                                            className="text-base text-app-text dark:text-app-text-dark text-right min-w-[80px]"
                                        />
                                    </View>

                                    <View className="flex-row items-center justify-between p-5">
                                        <View className="flex-row items-center gap-4">
                                            <View className="w-10 h-10 rounded-full bg-app-soft dark:bg-app-soft-dark items-center justify-center">
                                                <Feather name="repeat" size={18} color={isDark ? '#E6EDF3' : '#0D1B2A'} />
                                            </View>
                                            <Text className="text-base font-medium text-app-text dark:text-app-text-dark">Rate to {baseCurrency}</Text>
                                        </View>
                                        <TextInput
                                            value={rate}
                                            onChangeText={setRate}
                                            placeholder="1.00"
                                            placeholderTextColor={isDark ? '#8B949E' : '#6B7A8F'}
                                            keyboardType="decimal-pad"
                                            className="text-base text-app-text dark:text-app-text-dark text-right min-w-[100px]"
                                            editable={code.toUpperCase() !== baseCurrency}
                                        />
                                    </View>
                                </View>

                                {error ? (
                                    <Text className="text-xs text-app-danger dark:text-app-danger-dark mt-3">
                                        {error}
                                    </Text>
                                ) : null}

                                <View className="mt-6">
                                    <Button
                                        title={editing ? 'Update currency' : 'Add currency'}
                                        onPress={handleSave}
                                        variant="primary"
                                        icon={<Feather name="check" size={20} color="#FFFFFF" />}
                                    />
                                </View>
                            </ScrollView>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}
