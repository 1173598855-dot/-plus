import type { Task, TaskClock, TaskDraft, TaskEnergy, TaskFilters, TaskGroups, TaskPatch, TaskStatus } from './taskTypes';
import { isCalendarDate, isIsoTimestamp, taskSchemaLimits } from './taskSchema';

const statuses: TaskStatus[] = ['inbox', 'next', 'scheduled', 'waiting', 'done'];
const energies: TaskEnergy[] = ['low', 'medium', 'high'];
const priorityRank = { urgent: 0, high: 1, medium: 2, low: 3 } satisfies Record<Task['priority'], number>;
const sortOrderStep = 1000;

function normalizeText(value: string | undefined): string {
  return value?.trim() ?? '';
}

function normalizeBoundedText(value: string | undefined, maxLength: number): string {
  return normalizeText(value).slice(0, maxLength);
}

function normalizeLabels(labels: string[] | undefined): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const label of labels ?? []) {
    const trimmed = label.trim().slice(0, taskSchemaLimits.maxLabelLength);
    if (trimmed && !seen.has(trimmed)) {
      normalized.push(trimmed);
      seen.add(trimmed);
      if (normalized.length === taskSchemaLimits.maxLabels) break;
    }
  }

  return normalized;
}

function normalizeSortOrder(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeEstimateMinutes(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function normalizeEnergy(value: TaskEnergy | undefined): TaskEnergy {
  return value && energies.includes(value) ? value : 'medium';
}

function requireTitle(title: string | undefined): string {
  const normalized = normalizeBoundedText(title, taskSchemaLimits.maxTitleLength);
  if (!normalized) {
    throw new Error('Task title is required');
  }
  return normalized;
}

function requireId(id: string): string {
  const normalized = normalizeBoundedText(id, taskSchemaLimits.maxIdLength);
  if (!normalized) throw new Error('Task id is required');
  return normalized;
}

function requireTimestamp(value: string): string {
  if (!isIsoTimestamp(value)) throw new Error('Task timestamp is invalid');
  return value;
}

function matchesDueBucket(task: Task, due: TaskFilters['due'], today: string): boolean {
  if (!due || due === 'all') return true;
  if (due === 'none') return !task.dueDate;
  if (!task.dueDate) return false;
  if (due === 'overdue') return task.dueDate < today;
  if (due === 'today') return task.dueDate === today;
  return task.dueDate > today;
}

function dueRank(task: Task, today: string): number {
  if (task.status === 'done') return 4;
  if (!task.dueDate) return 3;
  if (task.dueDate < today) return 0;
  if (task.dueDate === today) return 1;
  return 2;
}

export function createTask(draft: TaskDraft, clock: TaskClock): Task {
  const status = draft.status ?? 'inbox';
  const completedAt = status === 'done' ? clock.now : '';

  return {
    id: requireId(clock.id),
    title: requireTitle(draft.title),
    notes: normalizeBoundedText(draft.notes, taskSchemaLimits.maxNotesLength),
    status,
    priority: draft.priority ?? 'medium',
    dueDate: isCalendarDate(normalizeText(draft.dueDate)) ? normalizeText(draft.dueDate) : '',
    project: normalizeBoundedText(draft.project, taskSchemaLimits.maxProjectLength),
    labels: normalizeLabels(draft.labels),
    createdAt: requireTimestamp(clock.now),
    updatedAt: requireTimestamp(clock.now),
    completedAt,
    sortOrder: normalizeSortOrder(draft.sortOrder, Date.parse(clock.now) || 0),
    estimateMinutes: normalizeEstimateMinutes(draft.estimateMinutes),
    energy: normalizeEnergy(draft.energy),
  };
}

export function nextTaskSortOrder(tasks: Task[], status: TaskStatus): number {
  const highestOrder = tasks.reduce((highest, task) => (task.status === status ? Math.max(highest, task.sortOrder) : highest), 0);
  const nextOrder = highestOrder + sortOrderStep;
  return Number.isFinite(nextOrder) && nextOrder > highestOrder ? nextOrder : sortOrderStep;
}

export function updateTask(task: Task, patch: TaskPatch, now: string): Task {
  const nextStatus = patch.status ?? task.status;
  const becameDone = task.status !== 'done' && nextStatus === 'done';
  const reopened = task.status === 'done' && nextStatus !== 'done';

  return {
    ...task,
    title: patch.title === undefined ? task.title : requireTitle(patch.title),
    notes: patch.notes === undefined ? task.notes : normalizeBoundedText(patch.notes, taskSchemaLimits.maxNotesLength),
    status: nextStatus,
    priority: patch.priority ?? task.priority,
    dueDate: patch.dueDate === undefined ? task.dueDate : (isCalendarDate(normalizeText(patch.dueDate)) ? normalizeText(patch.dueDate) : ''),
    project: patch.project === undefined ? task.project : normalizeBoundedText(patch.project, taskSchemaLimits.maxProjectLength),
    labels: patch.labels === undefined ? task.labels : normalizeLabels(patch.labels),
    updatedAt: now,
    completedAt: becameDone ? now : reopened ? '' : task.completedAt,
    sortOrder: patch.sortOrder === undefined ? task.sortOrder : normalizeSortOrder(patch.sortOrder, task.sortOrder),
    estimateMinutes: patch.estimateMinutes === undefined ? task.estimateMinutes : normalizeEstimateMinutes(patch.estimateMinutes),
    energy: patch.energy === undefined ? task.energy : normalizeEnergy(patch.energy),
  };
}

export function normalizeTasks(tasks: Task[]): Task[] {
  return tasks.map((task, index) => ({
    ...task,
    sortOrder: normalizeSortOrder(task.sortOrder, (index + 1) * sortOrderStep),
    estimateMinutes: normalizeEstimateMinutes(task.estimateMinutes),
    energy: normalizeEnergy(task.energy),
  }));
}

export function deleteTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id);
}

export function filterTasks(tasks: Task[], filters: TaskFilters, today: string, dueMatch: (task: Task, due: TaskFilters['due'], today: string) => boolean = matchesDueBucket): Task[] {
  const searchTerms = normalizeText(filters.search).toLowerCase().split(/\s+/).filter(Boolean);
  const project = normalizeText(filters.project).toLowerCase();
  const label = normalizeText(filters.label).toLowerCase();

  return tasks.filter((task) => {
    const haystack = [task.title, task.notes, task.project, task.labels.join(' ')].join(' ').toLowerCase();
    const matchesSearch = searchTerms.every((term) => haystack.includes(term));
    const matchesStatus = !filters.status || filters.status === 'all' || task.status === filters.status;
    const matchesPriority = !filters.priority || filters.priority === 'all' || task.priority === filters.priority;
    const matchesProject = !project || task.project.toLowerCase() === project;
    const matchesLabel = !label || task.labels.some((item) => item.toLowerCase() === label);

    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesLabel && dueMatch(task, filters.due, today);
  });
}

export function sortTasks(tasks: Task[], today: string): Task[] {
  return normalizeTasks(tasks).sort((left, right) => {
    const statusDelta = Number(left.status === 'done') - Number(right.status === 'done');
    if (statusDelta) return statusDelta;

    if (left.status === right.status) {
      const orderDelta = left.sortOrder - right.sortOrder;
      if (orderDelta) return orderDelta;
    }

    const dueDelta = dueRank(left, today) - dueRank(right, today);
    if (dueDelta) return dueDelta;

    if (left.dueDate && right.dueDate && left.dueDate !== right.dueDate) return left.dueDate.localeCompare(right.dueDate);

    const priorityDelta = priorityRank[left.priority] - priorityRank[right.priority];
    if (priorityDelta) return priorityDelta;

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export function moveTask(tasks: Task[], taskId: string, status: TaskStatus, targetIndex: number, now: string): Task[] {
  const normalizedTasks = normalizeTasks(tasks);
  const taskToMove = normalizedTasks.find((task) => task.id === taskId);
  if (!taskToMove) return normalizedTasks;

  const targetTasks = normalizedTasks
    .filter((task) => task.status === status && task.id !== taskId)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const boundedIndex = Math.max(0, Math.min(targetIndex, targetTasks.length));
  const reorderedTargetTasks = [
    ...targetTasks.slice(0, boundedIndex),
    updateTask(taskToMove, { status }, now),
    ...targetTasks.slice(boundedIndex),
  ];
  const reorderedById = new Map(
    reorderedTargetTasks.map((task, index) => [task.id, { ...task, sortOrder: (index + 1) * sortOrderStep }]),
  );

  return normalizedTasks.map((task) => reorderedById.get(task.id) ?? task);
}

export function summarizeTasks(tasks: Task[], today: string) {
  return tasks.reduce(
    (summary, task) => {
      summary.total += 1;
      if (task.status === 'done') {
        summary.completed += 1;
      } else {
        summary.active += 1;
        if (task.dueDate && task.dueDate < today) summary.overdue += 1;
        if (task.dueDate === today) summary.dueToday += 1;
      }
      if (task.priority === 'urgent') summary.urgent += 1;
      return summary;
    },
    { total: 0, active: 0, completed: 0, overdue: 0, dueToday: 0, urgent: 0 },
  );
}

export function groupTasksByStatus(tasks: Task[]): TaskGroups {
  const groups: TaskGroups = {
    inbox: [],
    next: [],
    scheduled: [],
    waiting: [],
    done: [],
  };
  for (const task of tasks) {
    groups[task.status].push(task);
  }
  return groups;
}

export { statuses as taskStatuses };
