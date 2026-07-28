export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage;
}

export function loadJson<T>(key: string, fallback: T, storage: StorageLike | undefined = browserStorage()): T {
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T, storage: StorageLike | undefined = browserStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[storage] Failed to save key "${key}":`, error);
    throw error;
  }
}
