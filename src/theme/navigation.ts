import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';
import { colors } from './tokens';

export function getNavigationTheme(mode: 'light' | 'dark'): Theme {
  const palette = mode === 'dark' ? colors.dark : colors.light;
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: palette.bg,
      card: palette.card,
      text: palette.text,
      border: palette.border,
      primary: palette.brand,
      notification: palette.accent,
    },
  };
}
