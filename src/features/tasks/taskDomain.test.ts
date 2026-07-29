import { describe, expect, it } from 'vitest';
import {
  createTask,
  deleteTask,
  filterTasks,
  groupTasksByStatus,
  sortTasks,
  moveTask,
  nextTaskSortOrder,
  summarizeTasks,
  updateTask,
} from './taskDomain';
import { decodeTaskArray } from './taskBackup';
import type { Task } from './taskTypes';

const baseTask: Task = {
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

describe('taskDomain', () => {
  it('creates a normalized task with timestamps', () => {
    const task = createTask(
      { title: '  Plan week  ', priority: 'high', estimateMinutes: 45, energy: 'high', labels: [' home ', 'home', 'Focus'] },
      { id: 'task-1', now: '2026-07-03T08:00:00.000Z' },
    );

    expect(task).toMatchObject({
      id: 'task-1',
      title: 'Plan week',
      notes: '',
      status: 'inbox',
      priority: 'high',
      dueDate: '',
      project: '',
      labels: ['home', 'Focus'],
      createdAt: '2026-07-03T08:00:00.000Z',
      updatedAt: '2026-07-03T08:00:00.000Z',
      completedAt: '',
      sortOrder: expect.any(Number),
      estimateMinutes: 45,
      energy: 'high',
    });
  });

  it('rejects a task without a title', () => {
    expect(() => createTask({ title: '   ' }, { id: 'task-1', now: '2026-07-03T08:00:00.000Z' })).toThrow(
      'Task title is required',
    );
  });

  it('updates a task and sets completion timestamps when status becomes done', () => {
    const updated = updateTask(baseTask, { status: 'done', title: ' Weekly review ', estimateMinutes: 30, energy: 'low' }, '2026-07-03T09:00:00.000Z');

    expect(updated.title).toBe('Weekly review');
    expect(updated.status).toBe('done');
    expect(updated.estimateMinutes).toBe(30);
    expect(updated.energy).toBe('low');
    expect(updated.updatedAt).toBe('2026-07-03T09:00:00.000Z');
    expect(updated.completedAt).toBe('2026-07-03T09:00:00.000Z');
  });

  it('clears completion timestamps when a done task is reopened', () => {
    const doneTask = { ...baseTask, status: 'done' as const, completedAt: '2026-07-02T09:00:00.000Z' };
    const updated = updateTask(doneTask, { status: 'next' }, '2026-07-03T09:00:00.000Z');

    expect(updated.status).toBe('next');
    expect(updated.completedAt).toBe('');
  });

  it('deletes a task by id', () => {
    const tasks = [baseTask, { ...baseTask, id: 'task-2', title: 'Read' }];

    expect(deleteTask(tasks, 'task-1')).toEqual([{ ...baseTask, id: 'task-2', title: 'Read' }]);
  });

  it('filters by search, priority, project, label, and due bucket', () => {
    const tasks: Task[] = [
      baseTask,
      { ...baseTask, id: 'task-2', title: 'Buy notebook', priority: 'low', dueDate: '', project: 'Home', labels: ['errand'] },
    ];

    const result = filterTasks(tasks, {
      search: 'weekly notes',
      priority: 'high',
      project: 'Life OS',
      label: 'focus',
      due: 'today',
    }, '2026-07-03');

    expect(result).toEqual([baseTask]);
  });

  it('summarizes total, active, completed, overdue, today, and urgent tasks', () => {
    const tasks: Task[] = [
      baseTask,
      { ...baseTask, id: 'task-2', status: 'done', completedAt: '2026-07-03T09:00:00.000Z' },
      { ...baseTask, id: 'task-3', dueDate: '2026-07-02', priority: 'urgent' },
    ];

    expect(summarizeTasks(tasks, '2026-07-03')).toEqual({
      total: 3,
      active: 2,
      completed: 1,
      overdue: 1,
      dueToday: 1,
      urgent: 1,
    });
  });

  it('groups tasks by status', () => {
    const tasks: Task[] = [baseTask, { ...baseTask, id: 'task-2', status: 'waiting' }];

    expect(groupTasksByStatus(tasks)).toMatchObject({
      inbox: [],
      next: [baseTask],
      scheduled: [],
      waiting: [{ ...baseTask, id: 'task-2', status: 'waiting' }],
      done: [],
    });
  });

  it('sorts actionable tasks before completed tasks by overdue, due date, priority, and recency', () => {
    const tasks: Task[] = [
      { ...baseTask, id: 'done', status: 'done', dueDate: '2026-07-01', priority: 'urgent', updatedAt: '2026-07-03T12:00:00.000Z' },
      { ...baseTask, id: 'later', dueDate: '2026-07-08', priority: 'urgent', updatedAt: '2026-07-03T08:00:00.000Z' },
      { ...baseTask, id: 'overdue-low', dueDate: '2026-07-02', priority: 'low', updatedAt: '2026-07-03T07:00:00.000Z' },
      { ...baseTask, id: 'today-high', dueDate: '2026-07-03', priority: 'high', updatedAt: '2026-07-03T06:00:00.000Z' },
      { ...baseTask, id: 'today-urgent', dueDate: '2026-07-03', priority: 'urgent', updatedAt: '2026-07-03T05:00:00.000Z' },
    ];

    expect(sortTasks(tasks, '2026-07-03').map((task) => task.id)).toEqual([
      'overdue-low',
      'today-urgent',
      'today-high',
      'later',
      'done',
    ]);
  });

  it('moves a task to a chosen position within its status', () => {
    const tasks: Task[] = [
      { ...baseTask, id: 'first', title: 'First', dueDate: '2026-07-03', priority: 'high', sortOrder: 1000 },
      { ...baseTask, id: 'second', title: 'Second', dueDate: '2026-07-04', priority: 'urgent', sortOrder: 2000 },
      { ...baseTask, id: 'third', title: 'Third', dueDate: '', priority: 'medium', sortOrder: 3000 },
    ];

    const moved = moveTask(tasks, 'third', 'next', 0, '2026-07-03T10:00:00.000Z');

    expect(sortTasks(moved, '2026-07-03').map((task) => task.id)).toEqual(['third', 'first', 'second']);
    expect(moved.find((task) => task.id === 'third')).toMatchObject({
      status: 'next',
      updatedAt: '2026-07-03T10:00:00.000Z',
    });
  });

  it('returns a sort order after the highest task in the target status', () => {
    const tasks: Task[] = [
      { ...baseTask, id: 'target', status: 'next', sortOrder: 9000000000 },
      { ...baseTask, id: 'other-status', status: 'waiting', sortOrder: 12000000000 },
    ];

    expect(nextTaskSortOrder(tasks, 'next')).toBe(9000001000);
    expect(nextTaskSortOrder(tasks, 'inbox')).toBe(1000);
  });

  it('keeps programmatically created and updated tasks within the backup schema limits', () => {
    const created = createTask({
      title: `  ${'t'.repeat(600)}  `,
      notes: 'n'.repeat(20001),
      project: 'p'.repeat(201),
      labels: Array.from({ length: 55 }, (_, index) => ` ${index}-${'l'.repeat(100)} `),
    }, { id: 'i'.repeat(201), now: '2026-07-03T08:00:00.000Z' });
    const updated = updateTask(created, {
      title: 'u'.repeat(600),
      notes: 'n'.repeat(20001),
      project: 'p'.repeat(201),
      labels: Array.from({ length: 55 }, (_, index) => `${index}-${'l'.repeat(100)}`),
    }, '2026-07-03T09:00:00.000Z');

    expect(decodeTaskArray([created])).toEqual([created]);
    expect(decodeTaskArray([updated])).toEqual([updated]);
  });

  it('returns a finite, strictly later append order when a column contains Number.MAX_VALUE', () => {
    const tasks = [{ ...baseTask, id: 'extreme', sortOrder: Number.MAX_VALUE }];
    const nextOrder = nextTaskSortOrder(tasks, 'next');

    expect(nextOrder).toBeGreaterThan(0);
    expect(Number.isFinite(nextOrder)).toBe(true);
    expect(nextOrder).not.toBe(Number.MAX_VALUE);
  });
});
