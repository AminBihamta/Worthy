import { create } from 'zustand';
import { getAllSettings, setSetting } from '../db/repositories/settings';

export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsState {
  themeMode: ThemeMode;
  hoursPerDay: number;
  baseCurrency: string;
  loaded: boolean;
  hydrate: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setHoursPerDay: (value: number) => Promise<void>;
  setBaseCurrency: (code: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  themeMode: 'system',
  hoursPerDay: 8,
  baseCurrency: 'USD',
  loaded: false,
  hydrate: async () => {
    const settings = await getAllSettings();
    const baseCurrency = settings.base_currency || 'USD';
    set({
      themeMode: (settings.theme_mode as ThemeMode) || 'system',
      hoursPerDay: Number.parseInt(settings.hours_per_day ?? '8', 10),
      baseCurrency,
      loaded: true,
    });
    if (!settings.base_currency) {
      await setSetting('base_currency', baseCurrency);
    }
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
}));
