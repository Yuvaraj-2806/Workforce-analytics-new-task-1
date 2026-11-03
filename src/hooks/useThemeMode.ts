import { useState, useCallback, useEffect } from 'react';
import type { ThemeMode } from '../types';

export const useThemeMode = () => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('wf-theme-mode');
    return (stored as ThemeMode) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('wf-theme-mode', mode);
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { mode, toggleTheme };
};
