import { create } from 'zustand';
import type { AppSettings } from '../types';
import { DEFAULT_APP_SETTINGS } from '../lib/mockData';
import { soundManager } from '../lib/sound';

interface SettingsState {
  isDarkMode: boolean;
  isOnline: boolean;
  pendingSyncCount: number;
  settings: AppSettings;
  soundMuted: boolean;
  toggleDarkMode: () => void;
  setIsOnline: (online: boolean) => void;
  setPendingSyncCount: (count: number) => void;
  toggleSoundMute: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const savedDark = localStorage.getItem('fc_dark_mode') === 'true';
  const savedSettings = localStorage.getItem('fc_app_settings');
  const initialSettings = savedSettings ? JSON.parse(savedSettings) : DEFAULT_APP_SETTINGS;

  return {
    isDarkMode: savedDark,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingSyncCount: 0,
    settings: initialSettings,
    soundMuted: soundManager.getMuted(),

    toggleDarkMode: () => {
      const next = !get().isDarkMode;
      localStorage.setItem('fc_dark_mode', String(next));
      set({ isDarkMode: next });
    },

    setIsOnline: (isOnline) => set({ isOnline }),

    setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),

    toggleSoundMute: () => {
      const next = !get().soundMuted;
      soundManager.setMuted(next);
      set({ soundMuted: next });
    },

    updateSettings: (newSettings) => {
      const merged = { ...get().settings, ...newSettings };
      localStorage.setItem('fc_app_settings', JSON.stringify(merged));
      set({ settings: merged });
    },
  };
});
