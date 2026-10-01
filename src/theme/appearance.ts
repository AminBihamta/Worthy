import { Appearance } from 'react-native';
import type { ThemeMode } from '../state/useSettingsStore';

export function applyThemeMode(mode: ThemeMode): void {
  // RN 0.85 uses "unspecified" to follow the system. NativeWind 4's
  // setColorScheme("system") passes null, which crashes Android's native module.
  // NativeWind observes Appearance changes, so it still receives theme updates.
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
}
