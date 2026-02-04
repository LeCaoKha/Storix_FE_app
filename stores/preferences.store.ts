import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type Language = 'vi' | 'en';

interface PreferencesState {
  theme: Theme;
  language: Language;
  notificationsEnabled: boolean;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleNotifications: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'vi',
      notificationsEnabled: true,
      
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleNotifications: () => set((state) => ({ 
        notificationsEnabled: !state.notificationsEnabled 
      })),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);