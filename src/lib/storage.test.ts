import { describe, expect, it } from 'vitest';
import { loadJson, saveJson, type StorageLike } from './storage';

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
