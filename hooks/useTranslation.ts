import { usePreferencesStore } from '@/stores/preferences.store';
import { translations, TranslationKeys } from '@/locales/translations';

type NestedKeys<T> = T extends object
  ? { [K in keyof T & string]: K | `${K}.${NestedKeys<T[K]>}` }[keyof T & string]
  : never;

export const useTranslation = () => {
  const language = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = translations[language];
    let result = '';

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if key missing in current language
        let fallback: any = translations.en;
        let foundFallback = true;
        for (const fKey of keys) {
            if (fallback && typeof fallback === 'object' && fKey in fallback) {
                fallback = fallback[fKey];
            } else {
                foundFallback = false;
                break;
            }
        }
        current = foundFallback ? fallback : path;
        break;
      }
    }

    result = typeof current === 'string' ? current : path;

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
    }

    return result;
  };

  return { t, language, setLanguage };
};
