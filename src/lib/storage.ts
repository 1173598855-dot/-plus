export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type JsonReadResult<T> =
  | { status: 'missing' }
  | { status: 'success'; value: T; raw: string }
  | { status: 'invalid'; raw: string }
  | { status: 'unavailable' };

function browserStorage(): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage;
}

export function readJson<T>(key: string, storage?: StorageLike): JsonReadResult<T> {
  try {
    const resolvedStorage = storage ?? browserStorage();
    if (!resolvedStorage) return { status: 'unavailable' };
    const raw = resolvedStorage.getItem(key);
    if (raw === null) return { status: 'missing' };
    try {
      return { status: 'success', value: JSON.parse(raw) as T, raw };
    } catch {
      return { status: 'invalid', raw };
    }
  } catch {
    return { status: 'unavailable' };
  }
}

export function loadJson<T>(key: string, fallback: T, storage?: StorageLike): T {
  const result = readJson<T>(key, storage);
  return result.status === 'success' ? result.value : fallback;
}

export function saveJson<T>(key: string, value: T, storage?: StorageLike): void {
  try {
    const resolvedStorage = storage ?? browserStorage();
    if (!resolvedStorage) return;
    resolvedStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[storage] Failed to save key "${key}":`, error);
    throw error;
  }
}
