
import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { SelectField } from '../../components/SelectField'; // Import SelectField
import { getDb } from '../../db';
import { createId } from '../../utils/id';

// Extended currency options for individual accounts (can be same as base for now)
const CURRENCIES = [
    { label: 'USD - US Dollar', value: 'USD' },
    { label: 'EUR - Euro', value: 'EUR' },
    { label: 'GBP - British Pound', value: 'GBP' },
    { label: 'JPY - Japanese Yen', value: 'JPY' },
    { label: 'CAD - Canadian Dollar', value: 'CAD' },
    { label: 'AUD - Australian Dollar', value: 'AUD' },
    { label: 'CHF - Swiss Franc', value: 'CHF' },
    { label: 'CNY - Chinese Yuan', value: 'CNY' },
    { label: 'INR - Indian Rupee', value: 'INR' },
    // Could theoretically allow custom here too, but stick to list for simplicity or add 'Other' later if requested.
    // User requirement "Allow adding other currencies other than the base currency" implies selection.
];

export default function OnboardingAccountForm({ navigation, route }: { navigation: any, route: any }) {
    const { colorScheme } = useColorScheme();
    const palette = colorScheme === 'dark' ? colors.dark : colors.light;
    const insets = useSafeAreaInsets();

    // Params passed from previous screen
    const { type, defaultName, currency: baseCurrency } = route.params;

    const [name, setName] = useState(defaultName);
    const [balance, setBalance] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState(baseCurrency);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Name required", "Please enter an account name.");
            return;
        }

        // Convert balance to minor units (integer cents)
        const numericBalance = parseFloat(balance) || 0;
        const minorBalance = Math.round(numericBalance * 100);

        const db = await getDb();
        await db.runAsync(
            'INSERT INTO accounts (id, name, type, currency, starting_balance_minor, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            createId('acct_'),
            name,
            type,
            selectedCurrency, // Use selected currency
            minorBalance,
            Date.now()
        );

        navigation.goBack();
    };

    return (
        <View style={{ flex: 1, backgroundColor: palette.bg, padding: 24 }}>
            <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 24, color: palette.text, marginBottom: 24 }}>
                Add {type === 'credit_card' ? 'Credit Card' : type === 'cash' ? 'Cash' : 'Account'}
            </Text>

            <View style={{ gap: 20 }}>
                <Input
                    label="Account Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Wallet, Main Bank"
                />

                <SelectField
                    label="Currency"
                    value={selectedCurrency}
                    options={CURRENCIES}
                    onChange={(val) => setSelectedCurrency(val)}
                />

                <Input
                    label={`Starting Balance (${selectedCurrency})`}
                    value={balance}
                    onChangeText={setBalance}
                    placeholder="0.00"
                    keyboardType="numeric"
                    autoFocus
                />
            </View>

            <View style={{ marginTop: 40 }}>
                <Button title="Save Account" onPress={handleSave} variant="primary" />
            </View>
        </View>
    );
}
