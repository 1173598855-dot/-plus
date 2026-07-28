import { describe, expect, it } from 'vitest';
import { loadJson, readJson, saveJson, type StorageLike } from './storage';

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  return {
    data: { ...initial },
    getItem(key: string) {
      return this.data[key] ?? null;
    },
    setItem(key: string, value: string) {
      this.data[key] = value;
    },
  };
}

describe('storage', () => {
  it('returns invalid JSON with its original raw text', () => {
    const storage = createMemoryStorage({ tasks: '{broken' });

    expect(readJson('tasks', storage)).toEqual({ status: 'invalid', raw: '{broken' });
  });

  it('distinguishes missing, successful, and unavailable reads', () => {
    const storage = createMemoryStorage({ saved: JSON.stringify({ id: 'task-1' }) });

    expect(readJson('missing', storage)).toEqual({ status: 'missing' });
    expect(readJson<{ id: string }>('saved', storage)).toEqual({ status: 'success', value: { id: 'task-1' }, raw: JSON.stringify({ id: 'task-1' }) });
    expect(readJson('tasks', undefined)).not.toEqual({ status: 'invalid' });
  });

  it('returns unavailable when the browser storage getter throws', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });

    try {
      expect(readJson('tasks')).toEqual({ status: 'unavailable' });
    } finally {
      if (descriptor) Object.defineProperty(window, 'localStorage', descriptor);
      else delete (window as unknown as Record<string, unknown>).localStorage;
    }
  });

  it('loads parsed JSON from storage', () => {
    const storage = createMemoryStorage({ tasks: JSON.stringify([{ id: 'task-1' }]) });

    expect(loadJson('tasks', [], storage)).toEqual([{ id: 'task-1' }]);
  });

  it('saves JSON to storage', () => {
    const storage = createMemoryStorage();

    saveJson('tasks', [{ id: 'task-1' }], storage);

    expect(storage.data.tasks).toBe(JSON.stringify([{ id: 'task-1' }]));
  });

  it('returns fallback when JSON is malformed', () => {
    const storage = createMemoryStorage({ tasks: 'not-json' });

    expect(loadJson('tasks', [{ id: 'fallback' }], storage)).toEqual([{ id: 'fallback' }]);
  });

  it('returns fallback when storage throws while loading', () => {
    const storage: StorageLike = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {},
    };

    expect(loadJson('tasks', ['fallback'], storage)).toEqual(['fallback']);
  });
});
