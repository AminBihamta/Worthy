
import React, { useState } from 'react';
import { View, Text, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';
import { Button } from '../../components/Button';
import { PressableScale } from '../../components/PressableScale';
import { createId } from '../../utils/id';
import { getDb } from '../../db';
import { useSettingsStore } from '../../state/useSettingsStore';

// We will use a simplified form or a dialogue to add accounts here.
// For simplicity in this onboarding flow, let's use a simple distinct "Add Account" logic
// within this screen or navigate to a simplified form.
// Given strict "Keep it simple" requirement, let's inject a modal or just navigate to
// the existing Account Form but specialized for onboarding?
// Reusing 'AddEditAccountScreen' might be complex because it expects to go back.
// Let's build a quick inline adder or redirect.
// Actually, the user asked for "Screen 2: Account Setup. Show list... Let them add as many as they want".
// I will create a local state for accounts added during this session, then commit them or commit as we go.
// Committing as we go is safer.

type AccountItem = {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
};

export default function AccountsSetupScreen({ navigation }: { navigation: any }) {
    const { colorScheme } = useColorScheme();
    const palette = colorScheme === 'dark' ? colors.dark : colors.light;
    const insets = useSafeAreaInsets();
    const { baseCurrency } = useSettingsStore();
    const [accounts, setAccounts] = useState<AccountItem[]>([]);

    // We can use the existing 'AccountForm' screen from the main stack if we register it in this navigator,
    // OR just build a simple "Add" overlay here.
    // To keep it high quality, let's actually leverage the existing AddEditAccountScreen logic but simplified?
    // No, let's build a custom simple "Add Account" sheet/modal here to reduce friction.
    // Actually, for "Add Account", let's just make a row that expands or a separate screen pushed on stack.
    // Let's add a "AddAccountForm" screen to the Onboarding Navigator for better UX.

    // Wait, I can't easily add more files without Plan update if I am strict, but I can add it to this file or Navigator.
    // I will add a simple form IN this screen if the list is empty, or a button to open a modal.
    // Let's use a simple "Add" button that pushes to a new screen 'OnboardingAccountForm' (I'll add it to nav)
    // OR just use a simple mock here:
    // "Cash - $0"
    // "Bank - $1000"
    // Let's stick to the prompt: "Show a list of common account types... Let them add".
    // I'll Pre-populate a list of "Quick Add" buttons?
    // "Add Cash", "Add Bank", "Add Card".
    // When clicked, show a simple prompt for Name and Balance.

    // To implement this cleanly without complex navigation changes:
    // I will show a list of added accounts.
    // And a list of "Suggestions" to add.
    // Clicking a suggestion prompts for Balance (and Name if needed).

    const addAccount = async (type: string, defaultName: string) => {
        // In a real app, we'd show a modal input for balance.
        // For this prototype/MVP step, let's mock it or use a simple Alert prompt if possible?
        // React Native Alert.prompt only works on iOS.
        // I need a custom input.
        // Let's navigate to a dedicated form in the Onboarding Navigator.
        navigation.navigate('OnboardingAccountForm', { type, defaultName, currency: baseCurrency });
    };

    // NOTE: I need to add OnboardingAccountForm to the navigator. I will update the navigator file next.

    // Actually, I'll update the plan mentally to include 'OnboardingAccountForm'.
    // I will assume the navigator has 'OnboardingAccountForm'.

    // Wait, I need to fetch accounts to show them?
    // If we assume we are creating them fresh, we can just list what we added.
    // But to be robust, let's fetch from DB.

    const [loading, setLoading] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            loadAccounts();
        }, [])
    );

    const loadAccounts = async () => {
        const db = await getDb();
        const rows = await db.getAllAsync<any>('SELECT * FROM accounts ORDER BY created_at DESC');
        setAccounts(rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            balance: r.starting_balance_minor / 100, // assuming minor units
            currency: r.currency
        })));
    };

    const handleNext = () => {
        navigation.navigate('CategorySetup');
    };

    const handleDelete = async (id: string) => {
        const db = await getDb();
        await db.runAsync('DELETE FROM accounts WHERE id = ?', id);
        loadAccounts();
    };

    const cardAccents = ['#0A9396', '#EE9B00', '#38B000', '#94D2BD', '#E9D8A6'];

    const renderItem = ({ item, index }: { item: AccountItem, index: number }) => {
        const accent = cardAccents[index % cardAccents.length];

        return (
            <PressableScale onPress={() => { }}>
                <View style={{ aspectRatio: 1.586 }} className="w-72 rounded-[24px] bg-app-text dark:bg-app-card-dark overflow-hidden relative p-5 justify-between shadow-sm">
                    {/* Dark card background for contrast - enforcing dark feel for cards as per home screen */}
                    <View className="absolute inset-0 bg-[#0D1B2A]" />

                    {/* Decorative Blobs */}
                    <View
                        className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl"
                        style={{ backgroundColor: accent, opacity: 0.3 }}
                    />
                    <View
                        className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full blur-xl"
                        style={{ backgroundColor: accent, opacity: 0.2 }}
                    />

                    <View className="flex-row justify-between items-start">
                        <View>
                            <Text className="text-white/90 text-lg font-bold">{item.name}</Text>
                            <Text className="text-white/60 text-xs font-medium uppercase tracking-wider mt-1">{item.type} • {item.currency}</Text>
                        </View>
                        <PressableScale onPress={() => handleDelete(item.id)} style={{ padding: 4 }}>
                            <Feather name="trash-2" size={18} color="rgba(255,255,255,0.5)" />
                        </PressableScale>
                    </View>

                    <View>
                        <Text className="text-3xl font-display font-bold text-white">
                            {item.balance.toFixed(2)} <Text className="text-lg font-medium opacity-60">{item.currency}</Text>
                        </Text>
                    </View>
                </View>
            </PressableScale>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: palette.bg }}>
            <View style={{ flex: 1 }}>
                <View style={{ paddingHorizontal: 24, marginTop: 24, marginBottom: 24 }}>
                    <Text
                        style={{
                            fontFamily: 'Manrope_400Regular',
                            fontSize: 16,
                            color: palette.muted,
                            lineHeight: 24,
                        }}
                    >
                        Accounts represent your real-world money stashes—like your <Text style={{ color: palette.text, fontWeight: '700' }}>Wallet</Text>, <Text style={{ color: palette.text, fontWeight: '700' }}>Bank Account</Text>, or even a <Text style={{ color: palette.text, fontWeight: '700' }}>Piggy Bank</Text>.
                    </Text>
                    <Text
                        style={{
                            fontFamily: 'Manrope_400Regular',
                            fontSize: 14,
                            color: palette.muted,
                            marginTop: 8,
                            lineHeight: 20,
                            opacity: 0.8
                        }}
                    >
                        Create separate accounts to track where your money actually lives.
                    </Text>
                </View>

                <View>
                    <FlatList
                        data={accounts}
                        renderItem={({ item, index }) => renderItem({ item, index })}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
                        ListEmptyComponent={
                            <View style={{ width: 300, padding: 20, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: palette.border, borderRadius: 24, height: 190 }}>
                                <Text style={{ color: palette.muted, fontFamily: 'Manrope_400Regular' }}>
                                    Add your first account below.
                                </Text>
                            </View>
                        }
                        style={{ flexGrow: 0 }}
                    />
                </View>

                <View style={{ paddingHorizontal: 24, marginTop: 24, marginBottom: 12 }}>
                    <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: palette.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Quick Add
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        <QuickAddButton label="Cash" icon="dollar-sign" onPress={() => addAccount('cash', 'Cash')} palette={palette} />
                        <QuickAddButton label="Bank" icon="briefcase" onPress={() => addAccount('bank', 'General Bank')} palette={palette} />
                        <QuickAddButton label="Card" icon="credit-card" onPress={() => addAccount('credit_card', 'Credit Card')} palette={palette} />
                        <QuickAddButton label="E-Wallet" icon="smartphone" onPress={() => addAccount('other', 'E-Wallet')} palette={palette} />
                    </View>
                </View>

            </View>

            <View style={{ padding: 24, paddingBottom: insets.bottom + 20, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
                <Button
                    title={accounts.length > 0 ? "Next: Categories" : "Skip for now"}
                    onPress={handleNext}
                    variant="primary"
                    disabled={false}
                />
            </View>
        </View>
    );
}

function QuickAddButton({ label, icon, onPress, palette }: any) {
    return (
        <PressableScale onPress={onPress}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: palette.card,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: palette.border
            }}>
                <Feather name={icon} size={16} color={palette.text} style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: 'Manrope_600SemiBold', color: palette.text }}>{label}</Text>
            </View>
        </PressableScale>
    )
}
