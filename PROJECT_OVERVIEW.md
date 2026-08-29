# Worthy: Project Overview

> This document describes the current working tree as of 2026-08-29. It is intended to give a developer or coding agent enough context to work on the project without first rediscovering its product purpose, architecture, and main data flows.

## Executive summary

Worthy is a private, offline-first personal finance application for iOS, Android, and, through Expo, the web. It is built with Expo, React Native, and TypeScript. All financial data is stored locally in an SQLite database; the application has no backend and its core workflows do not depend on a network connection.

At a basic level, Worthy tracks accounts, expenses, income, transfers, categories, budgets, currencies, and recurring-rule metadata. Its more distinctive purpose is to help a person judge the _personal value_ of their spending instead of only recording where money went. Every expense can carry a 0–100 “regret / worth it” score. Income can include hours worked, which lets Worthy estimate an effective hourly rate and express a purchase as a “life cost” such as `2h 30m` of work. The Insights and Wrapped experiences turn these data points into an understandable story about spending behavior.

The product positioning embedded in the onboarding screens is:

- Track expenses, income, and transfers quickly.
- Show how many hours of work purchases cost.
- Keep all data on the device with no tracking or server storage.
- Remain free, without subscriptions or advertisements.

In short, Worthy is used for local personal money management with an emphasis on spending intentionality, privacy, and reflection.

## Who it is for

Worthy is designed for an individual who wants to manage finances manually and privately, especially someone who wants answers to questions such as:

- What is my balance across cash, bank, e-wallet, and credit accounts?
- How much did I earn and spend during a week, month, year, or all time?
- Which categories consume most of my money?
- Which purchases felt worthwhile afterward, and which caused regret?
- How much of my working life did a purchase cost?
- Am I within the limits I set for each category?
- What was the story of my money this week, month, quarter, or year?

It is not currently a bank-connected accounting product, a collaborative finance tool, or a cloud service. Users enter and manage their own data.

## Core user journey

### 1. Startup and local database initialization

`index.ts` registers the Expo application, the root `App.tsx` forwards to `src/App.tsx`, and `DatabaseProvider` opens `worthy.db`. On startup the database layer:

1. Enables SQLite foreign keys.
2. Reads `PRAGMA user_version`.
3. Applies pending migrations in transactions.
4. Seeds required categories and default settings.
5. Hydrates the Zustand settings store.

The UI stays on a “Preparing Worthy...” state until the database and Manrope fonts are ready.

### 2. Onboarding

Users who do not have `is_onboarded=true` in the settings table see a dedicated onboarding navigator:

1. An intro carousel explains tracking, life-cost insights, privacy, and the free/no-ads positioning.
2. The user chooses or creates a base currency and manual conversion rate.
3. The user creates one or more accounts.
4. The user reviews/customizes categories.
5. Onboarding is marked complete in SQLite.

After onboarding, a guided overlay introduces the balance, quick actions, transactions, budgets, and insights screens. Its completion state is also persisted in SQLite.

### 3. Everyday use

The post-onboarding experience has no login; reaching it simply means onboarding is complete. It has four bottom tabs:

- **Home** — total balance, account cards, add/income/transfer shortcuts, current-month income, today’s spending, Wrapped prompts, and recent transactions.
- **Transactions** — a combined, date-filterable timeline of expenses, income, and transfers, with links to detail and edit flows.
- **Budgets** — per-category limits compared with spending over the selected reporting period.
- **Insights** — time-series charts, category breakdowns, regret analysis, life-cost data, and Worthy Wrapped.

Management screens for accounts, currencies, categories, recurring rules, widgets, privacy, and settings are reached primarily from Home/Settings.

## Product features

### Accounts and balances

Accounts have a name, type (`cash`, `bank`, `ewallet`, or `credit`), currency, starting balance, and archive timestamp. An account balance is calculated rather than stored:

```text
starting balance
+ converted income
- converted expenses
+ incoming transfers
- outgoing transfers
```

Archiving hides an account without deleting its historical records. The Home and Settings screens aggregate all active accounts into the selected base currency.

### Expenses and the “worth it” signal

An expense records a title, amount in integer minor units, category, account, transaction currency, date, notes, and a `slider_0_100` value. The UI describes the scale as:

- 0: Total regret
- 25: Mostly regret
- 50: Mixed feelings
- 75: Worth it
- 100: Absolutely worth it

This signal drives regret-distribution charts, the best/worst categories by perceived value, and individual transaction displays. The code uses lower scores to mean more regret and higher scores to mean greater satisfaction.

Expense entry also remembers the previously used account, category, currency, score, and notes as “smart defaults” stored in the settings table.

### Income and life cost

Income records a source, amount, account, transaction currency, date, optional hours worked, and notes. Worthy calculates its effective hourly rate from income entries in the previous 30 days that include positive hours worked:

```text
effective hourly rate = converted income / hours worked
```

An expense’s life cost is then:

```text
purchase amount / effective hourly rate
```

The result is formatted as minutes, hours/minutes, workdays (using the configurable hours-per-day setting), or years. If no usable recent income-hours data exists, the life-cost display is unavailable rather than guessed.

### Transfers

Transfers move an amount between two different accounts and affect both calculated balances. They appear in the common transaction timeline alongside expenses and income.

The current transfer model stores one raw amount and no exchange-rate or destination-amount fields. Therefore, cross-currency transfers are not modeled as a true foreign-exchange transaction; the same minor-unit amount is subtracted from one account and added to the other.

### Categories and budgets

Categories have a name, Feather icon, color, sort order, and archive state. Worthy seeds common expense categories and maintains a protected, fixed-ID **Savings** category (`cat_system_savings`). The current working tree is replacing the former savings-goals/wishlist subsystem with this simpler savings-as-category approach.

Budgets associate one category with an amount, period type, and start date. The Budgets screen compares category spending with limits and shows total remaining, percentage used, overspending, and progress bars. Monthly and yearly period choices exist; weekly is visibly labeled “coming soon” in the budget editor. The reporting screen currently applies its selected global date range to every displayed budget rather than interpreting each budget’s stored period independently.

### Multi-currency support

Users define their own currencies, symbols, and `rate_to_base` values. The base currency has a rate of 1. Expense and income analytics multiply minor-unit amounts by the configured rate to normalize totals into the base currency. Account balance calculations convert transaction currencies into each account’s currency using the ratio between their rates.

Rates are manual. There is no exchange-rate API, synchronization service, or automatic refresh.

### Recurring rules

When creating an expense or income, a user can attach daily, weekly, biweekly, monthly, or yearly recurrence metadata. Worthy stores a compact RRULE-like string, the next run timestamp, and an active/paused flag. The recurring-rules screen lists and toggles these rules.

At present, no scheduler or startup worker consumes due rules to create future transactions or advance `next_run_ts`. The feature is therefore recurrence metadata and management UI, not yet an automatic recurring-transaction engine.

### Insights

Insights can be viewed by week, month, year, or all time. SQLite aggregation queries power:

- Expense and income trends over time.
- Spending by category.
- Distribution across five regret/worth-it buckets.
- Categories ranked by average regret or worth.
- Spending expressed in work hours by category.
- The effective hourly-rate calculation.

Charts are rendered with Victory/Victory Native. Date bucketing is done in SQLite with `strftime`, and the screen chooses day or month granularity based on the requested range.

### Worthy Wrapped

Wrapped is a playful carousel summarizing a week, month, quarter, or year. It reports:

- Total spent.
- Total earned.
- Net saved or overspent and savings rate.
- Top spending category.
- Biggest expense.
- Highest-spending day.
- Counts of logged expenses and income entries.

The Home screen prompts the user when a period has not yet been viewed. Last-viewed timestamps are stored in the settings table.

### Themes, widgets, and interaction design

The application supports system, light, and dark modes. It uses Manrope typography, NativeWind utility classes, React Native Reanimated transitions, gesture-based/swipeable rows, and Expo Haptics.

The in-app Widgets screen currently previews two reusable statistic cards—month income and today’s spending—which also appear on Home. These are application UI components, not implemented OS home-screen widgets.

## Technical architecture

### Technology stack

- **Runtime/framework:** Expo 54, React Native 0.81, React 19, TypeScript 5.9
- **Navigation:** React Navigation 7 (native stacks and bottom tabs)
- **Persistence:** `expo-sqlite`
- **Legacy data cleanup:** `expo-file-system`
- **State:** Zustand 5
- **Styling:** NativeWind 4 / Tailwind CSS 3, plus centralized theme tokens
- **Charts:** Victory and Victory Native
- **Motion/input:** Reanimated, Gesture Handler, Haptics, DateTimePicker, Slider
- **Build/distribution:** Expo Application Services configuration with over-the-air updates

### Layering

The codebase uses a pragmatic feature-screen plus repository structure:

```text
index.ts / App.tsx
  -> src/App.tsx (providers, startup, theme)
     -> navigation (onboarding or main tab/stack graph)
        -> screens (feature orchestration and local screen state)
           -> repositories (typed SQLite reads/writes)
              -> migrations + worthy.db
        -> shared components, hooks, utilities, and Zustand stores
```

There is no separate HTTP/API or server-domain layer. Screens call repository functions directly, generally reloading data in `useFocusEffect` when they become active.

### Important directories

- `src/db/` — database initialization, migrations, seeds, sample data, and repositories.
- `src/screens/` — feature screens grouped by Accounts, Budgets, Categories, Home, Insights, Onboarding, Recurring, Settings, and Transactions.
- `src/navigation/` — onboarding navigator and the main tab/stack graph.
- `src/components/` — buttons, cards, inputs, transaction rows, charts, widgets, tutorial overlay, and interaction primitives.
- `src/utils/` — money, currency conversion, dates/periods, life cost, recurring labels, smart defaults, Wrapped periods, and one-time legacy-data cleanup.
- `src/state/` — persisted settings facade and ephemeral period-selection UI state.
- `src/theme/` — color/radius tokens and React Navigation themes.
- `assets/` — application icons, splash art, and logo.

### State ownership

Most durable state is in SQLite. Zustand is deliberately small:

- `useSettingsStore` hydrates persisted theme, workday length, base currency, onboarding, intro, and tutorial flags, and writes changes back through the settings repository.
- `useUIStore` holds non-persisted selected reporting periods for Transactions, Budgets, and Insights.
- Individual screens own transient form fields, modal visibility, selected dates, and loaded query results.

### Database model

The active schema is migration version 4:

| Table             | Purpose                                                         | Important relationships                                     |
| ----------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| `accounts`        | Manual financial accounts and starting balances                 | Referenced by expenses, income, and both sides of transfers |
| `categories`      | Ordered/color-coded expense categories                          | Referenced by expenses and budgets                          |
| `expenses`        | Outgoing transactions and regret/worth-it score                 | Belongs to an account and category                          |
| `incomes`         | Incoming transactions and optional hours worked                 | Belongs to an account                                       |
| `transfers`       | Movement between accounts                                       | References source and destination accounts                  |
| `budgets`         | Category spending limits                                        | References a category                                       |
| `recurring_rules` | Recurrence metadata for an expense or income                    | Uses logical `entity_type`/`entity_id`, not a foreign key   |
| `currencies`      | User-managed conversion rates to the base currency              | Referenced logically by currency codes                      |
| `settings`        | Key/value preferences, flags, smart defaults, and Wrapped state | No foreign keys                                             |

Migration 3 removes the former `savings_buckets`, `savings_contributions`, and `wishlist_items` tables. Migration 4 deletes legacy managed receipt files, removes the obsolete receipt table, and clears its OCR preference. Monetary amounts are stored as integers in minor units to avoid floating-point errors in ordinary entry and display. Exchange rates and hours worked use real numbers where fractional values are required.

### Privacy and network behavior

The implemented feature code contains no fetch/HTTP client and no application backend. SQLite rows and settings stay in the app’s local storage. The Expo configuration does include Expo Updates for application code delivery, but this is distinct from transmitting personal finance data.

Settings includes a permanent **Delete all my data** action protected by a typed `DELETE` confirmation. It deletes and recreates the complete SQLite database, restores only factory seed data, resets in-memory settings/UI state, and returns the app to the first intro screen.

The Privacy screen says data remains local “unless you choose to export it,” but an export/backup/import workflow is not present in the current source tree.

## Development and operation

Install and start the project with:

```bash
npm install
npm run start
```

Common targets:

```bash
npm run ios
npm run android
npm run web
```

Static checks and formatting:

```bash
npm run lint
npm run format
```

Development builds expose Settings actions that generate 60 days of random expense/income sample data and reset onboarding. Sample generation requires at least one account and category.

## Current maturity and boundaries

The project is a substantial working application (roughly 13,000 lines of TypeScript/TSX) but is still evolving. A developer should keep these current boundaries in mind:

- There is no automated test suite in the repository.
- There is no bank connection, authentication, cloud sync, multi-user support, or server backend.
- Currency rates are entered manually.
- Cross-currency transfers do not store distinct source/destination values or an applied exchange rate.
- Recurring rules do not yet generate future transactions automatically.
- Backup, import, and export are not implemented even though the Privacy copy anticipates export.
- “Widgets” are reusable in-app cards, not native iOS/Android home-screen widgets.
- Weekly budgets are marked as coming soon, and the current budget reporting range is selected globally rather than driven by each stored budget period.
- The working tree is actively removing goals/wishlist functionality and consolidating savings into a built-in category. Older documentation mentioning savings goals is stale.

These are descriptions of the present implementation, not necessarily product decisions against adding those capabilities later.

## Mental model for future work

When changing Worthy, preserve these central ideas:

1. **Local-first is a product promise, not just an implementation detail.** New features should not silently require an account or upload financial data.
2. **Money is stored in minor units.** Convert at input/output boundaries and keep database arithmetic explicit.
3. **The base currency is the reporting lens.** Account currencies and transaction currencies can differ, while analytics normalize using user-managed rates.
4. **“Was it worth it?” is the distinguishing domain signal.** The regret slider, life-cost calculation, Insights, and Wrapped are the product’s reflective layer on top of conventional expense tracking.
5. **SQLite is the source of truth.** Zustand mostly mirrors settings or holds ephemeral UI selections; it is not the financial ledger.
6. **Archived master data preserves history.** Accounts, categories, budgets, and currencies are generally archived rather than hard-deleted, while individual transactions can be deleted.
7. **Screens orchestrate repositories directly.** A feature normally adds or updates a repository query, then reloads the affected screen on focus or after mutation.

That combination—private local bookkeeping plus an honest measure of money in satisfaction and hours of life—is what Worthy is and what it is used for.
