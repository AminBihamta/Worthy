import type { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';

import type { AccountType } from '../db/repositories/accounts';

export interface AccountTypeDefinition {
  id: AccountType;
  label: string;
  defaultName: string;
  description: string;
  icon: ComponentProps<typeof Feather>['name'];
  accent: string;
}

export const ACCOUNT_TYPES: AccountTypeDefinition[] = [
  {
    id: 'cash',
    label: 'Cash',
    defaultName: 'Wallet',
    description: 'Notes, coins and petty cash',
    icon: 'dollar-sign',
    accent: '#0A9396',
  },
  {
    id: 'bank',
    label: 'Bank',
    defaultName: 'Main bank',
    description: 'Checking or savings account',
    icon: 'briefcase',
    accent: '#3A86FF',
  },
  {
    id: 'credit',
    label: 'Credit card',
    defaultName: 'Credit card',
    description: 'Card balance and purchases',
    icon: 'credit-card',
    accent: '#F59E0B',
  },
  {
    id: 'ewallet',
    label: 'E-wallet',
    defaultName: 'E-wallet',
    description: 'Mobile and digital wallets',
    icon: 'smartphone',
    accent: '#8B5CF6',
  },
];

export function getAccountTypeDefinition(type: string): AccountTypeDefinition {
  return ACCOUNT_TYPES.find((definition) => definition.id === type) ?? ACCOUNT_TYPES[0];
}
