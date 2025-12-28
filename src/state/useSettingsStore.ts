import { create } from 'zustand';
import { getAllSettings, setSetting } from '../db/repositories/settings';

export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsState {
  themeMode: ThemeMode;
  hoursPerDay: number;
  baseCurrency: string;
  isOnboarded: boolean;
  loaded: boolean;
  hydrate: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setHoursPerDay: (value: number) => Promise<void>;
  setBaseCurrency: (code: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  hasSeenTutorial: boolean;
  completeTutorial: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  themeMode: 'system',
  hoursPerDay: 8,
  baseCurrency: 'USD',
  isOnboarded: false,
  hasSeenTutorial: false,
  loaded: false,
  hydrate: async () => {
    const settings = await getAllSettings();
    const baseCurrency = settings.base_currency || 'USD';
    set({
      themeMode: (settings.theme_mode as ThemeMode) || 'system',
      hoursPerDay: Number.parseInt(settings.hours_per_day ?? '8', 10),
      baseCurrency,
      isOnboarded: settings.is_onboarded === 'true',
      hasSeenTutorial: settings.has_seen_tutorial === 'true',
      loaded: true,
    });
    // We do NOT seed base_currency here anymore if missing, as it's part of onboarding.
  },
  setThemeMode: async (mode) => {
    await setSetting('theme_mode', mode);
    set({ themeMode: mode });
  },
  setHoursPerDay: async (value) => {
    await setSetting('hours_per_day', String(value));
    set({ hoursPerDay: value });
  },
  setBaseCurrency: async (code) => {
    const normalized = code.toUpperCase();
    await setSetting('base_currency', normalized);
    set({ baseCurrency: normalized });
  },
  completeOnboarding: async () => {
    await setSetting('is_onboarded', 'true');
    set({ isOnboarded: true });
  },
  resetOnboarding: async () => {
    await setSetting('is_onboarded', 'false');
    await setSetting('has_seen_tutorial', 'false');
    set({ isOnboarded: false, hasSeenTutorial: false });
  },
  completeTutorial: async () => {
    await setSetting('has_seen_tutorial', 'true');
    set({ hasSeenTutorial: true });
  },
}));
