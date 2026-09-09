import React, { createContext, useContext, useMemo, useState } from 'react';
import { StatusBar } from 'react-native';

const lightColors = {
  background: '#F2F2F2',
  surface: '#FFFFFF',
  expanded: '#FFFFFF',
  input: '#F7F8FA',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  primaryTint: '#DBEAFE',
  equal: '#16A34A',
  equalTint: '#DCFCE7',
  similar: '#D97706',
  similarTint: '#FEF3C7',
};

const darkColors = {
  background: '#111827',
  surface: '#1F2937',
  expanded: '#1F2937',
  input: '#262626',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  border: '#374151',
  primary: '#60A5FA',
  primaryPressed: '#60A5FA',
  primaryTint: '#1D4ED8',
  equal: '#4ADE80',
  equalTint: '#14532D',
  similar: '#FBBF24',
  similarTint: '#78350F',
};

type ThemeContextValue = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof lightColors;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const colors = isDark ? darkColors : lightColors;
  const value = useMemo(() => ({ isDark, toggleTheme: () => setIsDark((current) => !current), colors }), [colors, isDark]);

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme debe usarse dentro de ThemeProvider.');
  return theme;
}