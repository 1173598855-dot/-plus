export type TaskStatus = 'inbox' | 'next' | 'scheduled' | 'waiting' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskEnergy = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  project: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string;
  sortOrder: number;
  estimateMinutes: number;
  energy: TaskEnergy;
}

export interface TaskDraft {
  title: string;
  notes?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  project?: string;
  labels?: string[];
  sortOrder?: number;
  estimateMinutes?: number;
  energy?: TaskEnergy;
}

export type TaskPatch = Partial<Omit<TaskDraft, 'title'>> & {
  title?: string;
};

export interface TaskFilters {
  search?: string;
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  project?: string;
  label?: string;
  due?: 'all' | 'overdue' | 'today' | 'upcoming' | 'none';
}

export interface TaskSummary {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  dueToday: number;
  urgent: number;
}

export type TaskGroups = Record<TaskStatus, Task[]>;

export interface TaskClock {
  id: string;
  now: string;
}
