export type AppSettings = {
  notificationsEnabled: boolean;
  darkMode: boolean;
  monochromeMode: boolean;
};

const SETTINGS_KEY = 'appSettings';
const SETTINGS_EVENT = 'healix:settings-changed';

const defaultSettings: AppSettings = {
  notificationsEnabled: true,
  darkMode: false,
  monochromeMode: false,
};

const normalizeSettings = (value: unknown): AppSettings => {
  if (!value || typeof value !== 'object') {
    return defaultSettings;
  }

  const raw = value as Partial<AppSettings>;
  return {
    notificationsEnabled: typeof raw.notificationsEnabled === 'boolean' ? raw.notificationsEnabled : defaultSettings.notificationsEnabled,
    darkMode: typeof raw.darkMode === 'boolean' ? raw.darkMode : defaultSettings.darkMode,
    monochromeMode: typeof raw.monochromeMode === 'boolean' ? raw.monochromeMode : defaultSettings.monochromeMode,
  };
};

export const getAppSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return defaultSettings;
    }
    const parsed = JSON.parse(raw);
    return normalizeSettings(parsed);
  } catch {
    return defaultSettings;
  }
};

export const saveAppSettings = (next: Partial<AppSettings>): AppSettings => {
  const merged = {
    ...getAppSettings(),
    ...next,
  };
  const normalized = normalizeSettings(merged);
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: normalized }));
  return normalized;
};

export const clearAppSettings = () => {
  localStorage.removeItem(SETTINGS_KEY);
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: defaultSettings }));
};

export const subscribeToAppSettings = (listener: (settings: AppSettings) => void) => {
  const handler = (event: Event) => {
    const custom = event as CustomEvent<AppSettings>;
    listener(normalizeSettings(custom.detail));
  };

  window.addEventListener(SETTINGS_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener(SETTINGS_EVENT, handler as EventListener);
  };
};
