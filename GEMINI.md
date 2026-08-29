# Project: Worthy

## Project Overview

Worthy is an offline-first personal finance application for iOS, Android, and Expo web. It is built with Expo, React Native, TypeScript, SQLite, and NativeWind. Users manually track expenses, income, transfers, accounts, categories, budgets, currencies, and recurring-rule metadata. The product differentiator is reflection: expenses have a 0–100 worth-it score, income can include hours worked, and Insights/Wrapped turn those values into regret and life-cost summaries. The application supports system, light, and dark modes.

For the full current-state map, read [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md) before making changes. That document is grounded in the working tree and records the active schema, navigation, data flows, and known limitations.

## Building and Running

### Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Start the development server:
    ```bash
    npm run start
    ```

### Running on a device/simulator

*   **iOS:**
    ```bash
    npm run ios
    ```
*   **Android:**
    ```bash
    npm run android
    ```

### Linting and Formatting

*   **Lint:**
    ```bash
    npm run lint
    ```
*   **Format:**
    ```bash
    npm run format
    ```

## Development Conventions

### Architecture

The project follows a modular architecture:

-   `src/db`: Contains all SQLite-related logic, including migrations, repositories, and data seeding.
-   `src/screens`: Contains all the application screens, organized by feature.
-   `src/components`: Contains shared and reusable UI components.
-   `src/utils`: Contains utility functions for money, date, and life-cost calculations.
-   `src/state`: Contains global state management using Zustand.
-   `src/theme`: Contains theme tokens and navigation theme configuration.
-   `src/navigation`: Contains the root navigator and defines the app's screen structure.
-   `src/hooks`: Contains reusable derived-data hooks, including Home insight widgets.
-   `src/services`: Contains cross-cutting actions such as complete local data reset.
-   `src/data`: Contains static account-type and currency catalogs used by forms.

### Offline Data

The application is designed to be fully functional offline. All financial data is stored locally in
`worthy.db` using `expo-sqlite`; there is no server, login, bank integration, sync, or HTTP client.
Expo Updates remains configured for application-code delivery. Manual currency rates are normalized
to the selected base currency for reporting.

### Data and feature boundaries

- SQLite is the source of truth; Zustand only mirrors settings and transient reporting-period state.
- Monetary values are stored as integer minor units. Currency rates and hours worked may be fractional.
- Accounts and categories are archived to preserve history; transactions can be deleted.
- Recurring rules currently provide metadata and pause/resume UI only; they are not scheduled.
- Widgets are in-app cards. Backup/import/export, savings goals, wishlist, and receipt OCR are not
  implemented in the current tree.
- The protected `cat_system_savings` category replaces the former savings-bucket model.

### Styling

The project uses [NativeWind](https://www.nativewind.dev/) for styling, which allows for using Tailwind CSS utility classes in React Native. The `tailwind.config.js` file defines the color palette, fonts, and other design tokens. The application supports both light and dark modes.

### Fonts

The application uses the Manrope font from Google Fonts, loaded via `@expo-google-fonts/manrope`.

### State Management

Global UI and settings state is managed with [Zustand](https://github.com/pmndrs/zustand).

### Navigation

Navigation is handled by [React Navigation](https://reactnavigation.org/). The main navigation is a bottom tab bar, with each tab having its own stack navigator.

The four main tabs are Home, Transactions, Budgets, and Insights. On first launch, the root navigator
shows Intro → Welcome → Accounts setup → Category setup, then switches to the main tabs after
`is_onboarded` is persisted. Settings and management screens are nested in the relevant stacks.

### Verification

There is currently no automated test suite. `npm run lint` is available, but the current working tree
has pre-existing Prettier violations and unused-variable warnings; do not treat a clean lint result as
an established project invariant until those source changes are intentionally formatted.
