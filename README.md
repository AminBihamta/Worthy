# Worthy

Offline-first expense tracking built with Expo, React Native, TypeScript, SQLite, and NativeWind.

## Features

- Fully offline expense, income, transfer tracking (SQLite)
- Manual accounts + category management
- Budgets, savings buckets, and wishlist affordability
- Receipt Inbox with local image storage
- Life cost based on effective hourly rate
- Insights with charts (Victory)
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
```

## Architecture

- `src/db` holds SQLite migrations, repositories, and seeds
- `src/screens` contains feature screens
- `src/components` provides shared UI
- `src/utils` includes money, date, and life-cost helpers
- `src/state` contains zustand UI/settings state
- `src/theme` defines tokens and navigation theme

## Offline Data

All app data is stored locally using `expo-sqlite`. There is no network dependency for core features.

## Dev Sample Data

In development mode, Settings includes a “Generate sample data” button for analytics testing.

## Lint & Format

```bash
npm run lint
npm run format
```
