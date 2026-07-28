import type { Task, TaskEnergy, TaskPriority, TaskStatus } from './taskTypes';
import { normalizeTasks } from './taskDomain';

interface TaskBackup {
  version: 1;
  exportedAt: string;
  tasks: Task[];
}

const statuses: TaskStatus[] = ['inbox', 'next', 'scheduled', 'waiting', 'done'];
const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const energies: TaskEnergy[] = ['low', 'medium', 'high'];

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isNumberOrMissing(value: unknown): boolean {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value));
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false;
  const task = value as Partial<Task>;

  return (
    isString(task.id) &&
    isString(task.title) &&
    isString(task.notes) &&
    isString(task.dueDate) &&
    isString(task.project) &&
    isString(task.createdAt) &&
    isString(task.updatedAt) &&
    isString(task.completedAt) &&
    isNumberOrMissing(task.sortOrder) &&
    isNumberOrMissing(task.estimateMinutes) &&
    isStringArray(task.labels) &&
    statuses.includes(task.status as TaskStatus) &&
    priorities.includes(task.priority as TaskPriority) &&
    (task.energy === undefined || energies.includes(task.energy as TaskEnergy))
  );
}

function parseBackup(json: string): unknown {
  try {
    return JSON.parse(json) as unknown;
  } catch {
    throw new Error('导入文件不是有效的 JSON。');
  }
}

export function exportTasksToJson(tasks: Task[], exportedAt = new Date().toISOString()): string {
  const backup: TaskBackup = {
    version: 1,
    exportedAt,
    tasks,
  };

  return JSON.stringify(backup, null, 2);
}

export function importTasksFromJson(json: string): Task[] {
  const parsed = parseBackup(json);
  const tasks = Array.isArray(parsed) ? parsed : (parsed as Partial<TaskBackup> | null)?.tasks;

  if (!Array.isArray(tasks) || !tasks.every(isTask)) {
    throw new Error('导入文件不包含有效的任务数据。');
  }

  return normalizeTasks(tasks);
}
