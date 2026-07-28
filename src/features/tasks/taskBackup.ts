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

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isIsoTimestamp(value: string): boolean {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return false;

  const [, date, hours, minutes, seconds, timezone] = match;
  if (!isRealDate(date) || Number(hours) > 23 || Number(minutes) > 59 || (seconds !== undefined && Number(seconds) > 59)) return false;
  if (timezone !== 'Z') {
    const [offsetHours, offsetMinutes] = timezone.slice(1).split(':').map(Number);
    if (offsetHours > 14 || offsetMinutes > 59 || (offsetHours === 14 && offsetMinutes !== 0)) return false;
  }
  return !Number.isNaN(Date.parse(value));
}

const taskKeys = new Set([
  'id', 'title', 'notes', 'status', 'priority', 'dueDate', 'project', 'labels', 'createdAt', 'updatedAt', 'completedAt', 'sortOrder', 'estimateMinutes', 'energy',
]);

function decodeTask(value: unknown): Task | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const task = value as Partial<Task>;
  if (Object.keys(task).some((key) => !taskKeys.has(key))) return undefined;
  if (
    !isString(task.id) || !task.id.trim() || task.id.length > 200 ||
    !isString(task.title) || !task.title.trim() || task.title.length > 500 ||
    !isString(task.notes) || task.notes.length > 20000 ||
    !isString(task.project) || task.project.length > 200 ||
    !isStringArray(task.labels) || task.labels.length > 50 || task.labels.some((label) => label.length > 100) ||
    !isString(task.dueDate) || (task.dueDate !== '' && !isRealDate(task.dueDate)) ||
    !isString(task.createdAt) || !isIsoTimestamp(task.createdAt) ||
    !isString(task.updatedAt) || !isIsoTimestamp(task.updatedAt) ||
    !isString(task.completedAt) ||
    !isNumberOrMissing(task.sortOrder) || !isNumberOrMissing(task.estimateMinutes) ||
    !statuses.includes(task.status as TaskStatus) || !priorities.includes(task.priority as TaskPriority) ||
    (task.energy !== undefined && !energies.includes(task.energy as TaskEnergy))
  ) return undefined;
  if ((task.status === 'done' && !isIsoTimestamp(task.completedAt)) || (task.status !== 'done' && task.completedAt !== '')) return undefined;

  return {
    id: task.id,
    title: task.title,
    notes: task.notes,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    dueDate: task.dueDate,
    project: task.project,
    labels: [...task.labels],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt,
    sortOrder: task.sortOrder as number,
    estimateMinutes: task.estimateMinutes as number,
    energy: task.energy as TaskEnergy,
  };
}

export function decodeTaskArray(value: unknown): Task[] | undefined {
  if (!Array.isArray(value) || value.length > 10000) return undefined;
  const ids = new Set<string>();
  const tasks: Task[] = [];
  for (const item of value) {
    const task = decodeTask(item);
    if (!task || ids.has(task.id)) return undefined;
    ids.add(task.id);
    tasks.push(task);
  }
  return normalizeTasks(tasks);
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
  if (!Array.isArray(parsed) && (parsed as Partial<TaskBackup> | null)?.version !== 1) {
    throw new Error('不支持的任务备份版本。');
  }
  const tasks = Array.isArray(parsed) ? parsed : (parsed as Partial<TaskBackup> | null)?.tasks;
  const decoded = decodeTaskArray(tasks);

  if (!decoded) {
    throw new Error('导入文件不包含有效的任务数据。');
  }

  return decoded;
}
