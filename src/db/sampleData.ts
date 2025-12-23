import { addDays } from 'date-fns';
import { listAccounts } from './repositories/accounts';
import { listCategories } from './repositories/categories';
import { createExpense } from './repositories/expenses';
import { createIncome } from './repositories/incomes';

export async function generateSampleData(): Promise<void> {
  const accounts = await listAccounts();
  const categories = await listCategories();
  if (accounts.length === 0 || categories.length === 0) return;

  const account = accounts[0];
  const now = new Date();
  const start = addDays(now, -60);

  for (let dayOffset = 0; dayOffset < 60; dayOffset += 1) {
    const day = addDays(start, dayOffset).getTime();
    const dailyExpenses = Math.floor(Math.random() * 3);
    for (let i = 0; i < dailyExpenses; i += 1) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const amount = Math.floor(Math.random() * 5000) + 300;
      const slider = Math.floor(Math.random() * 100);
      await createExpense({
        title: `${category.name} spend`,
        amount_minor: amount,
        category_id: category.id,
        account_id: account.id,
        date_ts: day + Math.floor(Math.random() * 10) * 3600 * 1000,
        slider_0_100: slider,
        notes: null,
      });
    }

    if (dayOffset % 14 === 0) {
      const income = Math.floor(Math.random() * 400000) + 120000;
      await createIncome({
        source: 'Paycheck',
        amount_minor: income,
        account_id: account.id,
        date_ts: day + 10 * 3600 * 1000,
        hours_worked: 80,
        notes: null,
      });
    }
  }
}
