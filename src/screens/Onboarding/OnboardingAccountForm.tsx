
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { SelectField } from '../../components/SelectField'; // Import SelectField
import { getDb } from '../../db';
import { CurrencyRow, listCurrencies } from '../../db/repositories/currencies';
import { createId } from '../../utils/id';

export default function OnboardingAccountForm({ navigation, route }: { navigation: any, route: any }) {
    const { colorScheme } = useColorScheme();
    const palette = colorScheme === 'dark' ? colors.dark : colors.light;
    const insets = useSafeAreaInsets();

    // Params passed from previous screen
    const { type, defaultName, currency: baseCurrency } = route.params;

    const [name, setName] = useState(defaultName);
    const [balance, setBalance] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState(baseCurrency);
    const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);

    useEffect(() => {
        let active = true;
        listCurrencies().then((items) => {
            if (!active) return;
            setCurrencies(items);
        });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!currencies.length) return;
        if (!currencies.some((item) => item.code === selectedCurrency)) {
            setSelectedCurrency(currencies[0].code);
        }
    }, [currencies, selectedCurrency]);

    const currencyOptions = useMemo(() => {
        if (currencies.length === 0) {
            return baseCurrency
                ? [{ label: baseCurrency, value: baseCurrency }]
                : [];
        }
        return currencies.map((currency) => ({
            label: `${currency.code} · ${currency.name}`,
            value: currency.code,
        }));
    }, [currencies, baseCurrency]);

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
                    options={currencyOptions}
                    onChange={(val) => setSelectedCurrency(val)}
                    placeholder={currencyOptions.length === 0 ? 'Add a currency first' : undefined}
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
