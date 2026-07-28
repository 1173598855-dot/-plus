import { describe, expect, it } from 'vitest';
import { decodeTaskArray, exportTasksToJson, importTasksFromJson } from './taskBackup';
import type { Task } from './taskTypes';

const task: Task = {
  id: 'task-1',
  title: 'Write weekly review',
  notes: 'Use notes from Friday',
  status: 'next',
  priority: 'high',
  dueDate: '2026-07-03',
  project: 'Life OS',
  labels: ['review', 'focus'],
  createdAt: '2026-07-01T08:00:00.000Z',
  updatedAt: '2026-07-01T08:00:00.000Z',
  completedAt: '',
  sortOrder: 1000,
  estimateMinutes: 45,
  energy: 'high',
};

const unsafeTaskArrays: unknown[] = [
  [{ ...task, id: '' }],
  [{ ...task, id: '   ' }],
  [{ ...task, dueDate: '2026-02-30' }],
  [{ ...task, createdAt: 'yesterday' }],
  [{ ...task, status: 'done', completedAt: '' }],
  [{ ...task, status: 'next', completedAt: '2026-07-01T08:00:00.000Z' }],
  [{ ...task }, { ...task }],
  [{ ...task, notes: 'x'.repeat(20001) }],
  [{ ...task, labels: Array.from({ length: 51 }, (_, index) => `label-${index}`) }],
  [{ ...task, hiddenSecret: 'must-not-round-trip' }],
];

describe('taskBackup', () => {
  it('decodes a valid empty task array', () => {
    expect(decodeTaskArray([])).toEqual([]);
  });

  it('rejects a whitespace-only task title', () => {
    expect(decodeTaskArray([{ ...task, title: '   ' }])).toBeUndefined();
  });

  it.each(unsafeTaskArrays)('rejects unsafe task data %#', (tasks) => {
    expect(decodeTaskArray(tasks)).toBeUndefined();
  });

  it('exports tasks as readable JSON with a schema version', () => {
    const json = exportTasksToJson([task]);

    expect(JSON.parse(json)).toEqual({
      version: 1,
      exportedAt: expect.any(String),
      tasks: [task],
    });
    expect(json).toContain('\n  "tasks"');
  });

  it('imports tasks from the backup format', () => {
    const json = JSON.stringify({ version: 1, exportedAt: '2026-07-03T08:00:00.000Z', tasks: [task] });

    expect(importTasksFromJson(json)).toEqual([task]);
  });

  it('imports a raw task array for compatibility', () => {
    expect(importTasksFromJson(JSON.stringify([task]))).toEqual([task]);
  });

  it('rejects unsupported object backup versions', () => {
    expect(() => importTasksFromJson(JSON.stringify({ version: 2, tasks: [task] }))).toThrow('不支持的任务备份版本。');
  });

  it('adds sort order when importing older task backups', () => {
    const { sortOrder, estimateMinutes, energy, ...legacyTask } = task;

    expect(importTasksFromJson(JSON.stringify([legacyTask]))).toEqual([{
      ...legacyTask,
      sortOrder: 1000,
      estimateMinutes: 0,
      energy: 'medium',
    }]);
  });

  it('rejects malformed JSON', () => {
    expect(() => importTasksFromJson('not-json')).toThrow('导入文件不是有效的 JSON。');
  });

  it('rejects values that are not task arrays', () => {
    expect(() => importTasksFromJson(JSON.stringify({ version: 1, tasks: [{ id: 'missing-fields' }] }))).toThrow(
      '导入文件不包含有效的任务数据。',
    );
  });
});
