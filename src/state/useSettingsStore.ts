import { create } from 'zustand';
import { getAllSettings, setSetting } from '../db/repositories/settings';

export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsState {
  themeMode: ThemeMode;
  fixedHourlyRateMinor: number;
  hoursPerDay: number;
  loaded: boolean;
  hydrate: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setFixedHourlyRateMinor: (value: number) => Promise<void>;
  setHoursPerDay: (value: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  themeMode: 'system',
  fixedHourlyRateMinor: 0,
  hoursPerDay: 8,
  loaded: false,
  hydrate: async () => {
    const settings = await getAllSettings();
    set({
      themeMode: (settings.theme_mode as ThemeMode) || 'system',
      fixedHourlyRateMinor: Number.parseInt(settings.fixed_hourly_rate_minor ?? '0', 10),
      hoursPerDay: Number.parseInt(settings.hours_per_day ?? '8', 10),
      loaded: true,
    });
  },
  setThemeMode: async (mode) => {
    await setSetting('theme_mode', mode);
    set({ themeMode: mode });
  },
  setFixedHourlyRateMinor: async (value) => {
    await setSetting('fixed_hourly_rate_minor', String(value));
    set({ fixedHourlyRateMinor: value });
  },
  setHoursPerDay: async (value) => {
    await setSetting('hours_per_day', String(value));
    set({ hoursPerDay: value });
  },
}));
