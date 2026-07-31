import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      darkMode: false,
      language: 'English',

      toggleDarkMode: () => {
        const nextMode = !get().darkMode;
        if (nextMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ darkMode: nextMode });
      },

      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'smartserve_settings',
    }
  )
);
