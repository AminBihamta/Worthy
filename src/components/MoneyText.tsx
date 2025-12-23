import React from 'react';
import { Text } from 'react-native';
import { formatSigned } from '../utils/money';

export function MoneyText({
  amountMinor,
  currency,
  className = '',
}: {
  amountMinor: number;
  currency: string;
  className?: string;
}) {
  return <Text className={className}>{formatSigned(amountMinor, currency)}</Text>;
}
