/** Light, dark or "follow the system". Saved per browser; the page works without storage. */
import { useSyncExternalStore } from 'react';

export type Theme = 'system' | 'light' | 'dark';

const KEY = 'aya:theme';
const listeners = new Set<() => void>();

export function getTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}

export function setTheme(theme: Theme) {
  try {
    if (theme === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // Private mode or blocked storage: the choice lasts until the page closes.
  }
  current = theme;
  applyTheme(theme);
  for (const listener of listeners) listener();
}

let current: Theme | undefined;

export function useTheme(): Theme {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => {
      current ??= getTheme();
      return current;
    },
    () => 'system',
  );
}
