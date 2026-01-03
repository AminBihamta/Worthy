import { getSetting, setSetting } from '../db/repositories/settings';

const KEYS = {
  expense: {
    accountId: 'defaults_expense_account_id',
    categoryId: 'defaults_expense_category_id',
    currencyCode: 'defaults_expense_currency_code',
    regretValue: 'defaults_expense_regret_value',
    notes: 'defaults_expense_notes',
  },
  income: {
    accountId: 'defaults_income_account_id',
    currencyCode: 'defaults_income_currency_code',
    notes: 'defaults_income_notes',
    hoursWorked: 'defaults_income_hours_worked',
  },
  transfer: {
    fromAccountId: 'defaults_transfer_from_account_id',
    toAccountId: 'defaults_transfer_to_account_id',
    notes: 'defaults_transfer_notes',
  },
};

const parseNumber = (value: string | null) => {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export async function loadExpenseDefaults() {
  const [accountId, categoryId, currencyCode, regretValue, notes] = await Promise.all([
    getSetting(KEYS.expense.accountId),
    getSetting(KEYS.expense.categoryId),
    getSetting(KEYS.expense.currencyCode),
    getSetting(KEYS.expense.regretValue),
    getSetting(KEYS.expense.notes),
  ]);
  return {
    accountId,
    categoryId,
    currencyCode,
    regretValue: parseNumber(regretValue),
    notes,
  };
}

export async function saveExpenseDefaults(input: {
  accountId: string | null;
  categoryId: string | null;
  currencyCode: string | null;
  regretValue: number;
  notes: string;
}) {
  await Promise.all([
    input.accountId ? setSetting(KEYS.expense.accountId, input.accountId) : Promise.resolve(),
    input.categoryId ? setSetting(KEYS.expense.categoryId, input.categoryId) : Promise.resolve(),
    input.currencyCode ? setSetting(KEYS.expense.currencyCode, input.currencyCode) : Promise.resolve(),
    setSetting(KEYS.expense.regretValue, String(input.regretValue)),
    setSetting(KEYS.expense.notes, input.notes ?? ''),
  ]);
}

export async function loadIncomeDefaults() {
  const [accountId, currencyCode, notes, hoursWorked] = await Promise.all([
    getSetting(KEYS.income.accountId),
    getSetting(KEYS.income.currencyCode),
    getSetting(KEYS.income.notes),
    getSetting(KEYS.income.hoursWorked),
  ]);
  return {
    accountId,
    currencyCode,
    notes,
    hoursWorked,
  };
}

export async function saveIncomeDefaults(input: {
  accountId: string | null;
  currencyCode: string | null;
  notes: string;
  hoursWorked: string;
}) {
  await Promise.all([
    input.accountId ? setSetting(KEYS.income.accountId, input.accountId) : Promise.resolve(),
    input.currencyCode ? setSetting(KEYS.income.currencyCode, input.currencyCode) : Promise.resolve(),
    setSetting(KEYS.income.notes, input.notes ?? ''),
    setSetting(KEYS.income.hoursWorked, input.hoursWorked ?? ''),
  ]);
}

export async function loadTransferDefaults() {
  const [fromAccountId, toAccountId, notes] = await Promise.all([
    getSetting(KEYS.transfer.fromAccountId),
    getSetting(KEYS.transfer.toAccountId),
    getSetting(KEYS.transfer.notes),
  ]);
  return {
    fromAccountId,
    toAccountId,
    notes,
  };
}

export async function saveTransferDefaults(input: {
  fromAccountId: string | null;
  toAccountId: string | null;
  notes: string;
}) {
  await Promise.all([
    input.fromAccountId
      ? setSetting(KEYS.transfer.fromAccountId, input.fromAccountId)
      : Promise.resolve(),
    input.toAccountId
      ? setSetting(KEYS.transfer.toAccountId, input.toAccountId)
      : Promise.resolve(),
    setSetting(KEYS.transfer.notes, input.notes ?? ''),
  ]);
}
