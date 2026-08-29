# Worthy

Offline-first personal finance tracking built with Expo, React Native, TypeScript, SQLite, and NativeWind.

## Features

- Fully offline expense, income, transfer tracking (SQLite)
- Manual accounts + category management (including a built-in **Savings** category for budgets)
- Manual multi-currency support with user-managed conversion rates
- Budgets with monthly and yearly limits
- Life cost based on effective hourly rate
- Insights with charts (Victory), regret analysis, and spending by work hours
- Worthy Wrapped summaries for week, month, quarter, and year
- Recurring-rule metadata and in-app insight statistic cards
- Guided onboarding, tutorial, smart entry defaults, and sample data in development
- Light and dark mode

## Setup

```bash
npm install
npm run start
```

Run on device/simulator:

```bash
npm run ios
npm run android
npm run web
```

## Architecture

- `src/db` holds SQLite migrations, repositories, and seeds
- `src/screens` contains feature screens
- `src/components` provides shared UI
- `src/utils` includes money, date, and life-cost helpers
- `src/state` contains zustand UI/settings state
- `src/theme` defines tokens and navigation theme

## Offline Data

All financial data and settings are stored locally using `expo-sqlite`. There is no backend,
authentication, bank connection, cloud sync, or network dependency for core features. Expo Updates
is configured for delivering application code; it is separate from financial-data storage.

Rates are entered manually. Cross-currency transfers currently use one stored minor-unit amount and
do not record separate source/destination amounts or an exchange rate.

## Dev Sample Data

In development mode, Settings includes a “Generate sample data” button for analytics testing.

## Current boundaries

- Recurring rules are stored and can be paused, but no scheduler creates future transactions yet.
- Backup, import, and export are not implemented, despite the Privacy screen mentioning export.
- Widgets are reusable in-app statistic cards, not native home-screen widgets.
- Weekly budgets are labeled as coming soon; the Budgets screen applies its selected date range globally.
- The former savings-goals, wishlist, and receipt-inbox features are being removed. Savings is now a
  protected built-in expense category.

For the detailed product, data-model, navigation, and implementation context, see
[`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md).

## Lint & Format

```bash
npm run lint
npm run format
```
