import { createTask } from './taskDomain';
import type { Task } from './taskTypes';

export const seedTasks: Task[] = [
  createTask(
    {
      title: '整理本周重点任务',
      notes: '把零散想法收拢成今天可以推进的动作。',
      status: 'next',
      priority: 'high',
      dueDate: '2026-07-03',
      project: '个人系统',
      labels: ['个人', '规划', '专注'],
    },
    { id: 'seed-week-plan', now: '2026-07-03T08:00:00.000Z' },
  ),
  createTask(
    {
      title: '任务管理库第一篇文档',
      notes: '本地优先，先保证可用，再考虑同步。',
      status: 'scheduled',
      priority: 'urgent',
      dueDate: '2026-07-04',
      project: '个人任务管理库',
      labels: ['开发', 'MVP'],
    },
    { id: 'seed-build-mvp', now: '2026-07-03T08:10:00.000Z' },
  ),
  createTask(
    {
      title: '等待反馈：下一步是否加入番茄钟',
      status: 'waiting',
      priority: 'medium',
      project: '个人任务管理库',
      labels: ['想法'],
    },
    { id: 'seed-wait-feedback', now: '2026-07-03T08:20:00.000Z' },
  ),
];
