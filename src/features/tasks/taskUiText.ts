import type { TaskEnergy, TaskFilters, TaskPriority, TaskStatus } from './taskTypes';

export const statusLabels: Record<TaskStatus, string> = {
  inbox: '收件箱',
  next: '下一步',
  scheduled: '已安排',
  waiting: '等待中',
  done: '已完成',
};

export const priorityLabels: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const energyLabels: Record<TaskEnergy, string> = {
  low: '低精力',
  medium: '中精力',
  high: '高精力',
};

export const dueFilterLabels: Record<NonNullable<TaskFilters['due']>, string> = {
  all: '全部日期',
  overdue: '已逾期',
  today: '今天',
  upcoming: '即将到来',
  none: '无日期',
};

export function labelsFromInput(value: string): string[] {
  return value.split(',').map((label) => label.trim()).filter(Boolean);
}

export function labelsToInput(labels: string[]): string {
  return labels.join(', ');
}

export function formatEstimate(minutes: number): string {
  return minutes > 0 ? `${minutes} 分钟` : '无预计';
}

export const quickAddLabels = {
  brandMark: 'PT',
  brandTitle: '个人任务管理库',
  brandSubtitle: '本地优先的行动工作台',
  metricsTitle: '任务统计',
  active: '进行中',
  today: '今天',
  overdue: '逾期',
  completed: '完成',
  quickAddTitle: '捕捉任务',
  quickAdd: '新建任务',
  title: '任务标题',
  notes: '任务备注',
  notesPlaceholder: '备注',
  rail: '任务概览',
  status: '任务状态',
  priority: '任务优先级',
  dueDate: '截止日期',
  estimate: '预计用时（分钟）',
  estimatePlaceholder: '预计用时',
  energy: '精力类型',
  project: '项目',
  projectPlaceholder: '项目',
  labels: '标签',
  labelsPlaceholder: '标签，用英文逗号分隔',
  placeholder: '下一步要做什么？',
  expandDetails: '展开详细字段',
  collapseDetails: '收起详细字段',
  addTask: '添加任务',
  backupTitle: '任务备份',
  export: '导出',
  import: '导入任务 JSON',
  importInput: '导入任务 JSON',
  importTitle: '确认导入任务',
  replace: '替换当前任务',
  merge: '合并到当前任务',
  cancel: '取消导入',
  recoveryTitle: '本地存储恢复',
  downloadDamagedData: '下载损坏的原始数据',
  retryStorage: '重试本地存储',
  resetStorage: '使用当前任务重置本地存储',
} as const;

export const columnQuickAddLabels = {
  form: (status: string) => `在${status}中新建任务`,
  title: (status: string) => `${status}任务标题`,
  submit: (status: string) => `添加到${status}`,
  placeholder: '添加任务',
  created: (status: string, title: string) => `已在${status}创建任务“${title}”。`,
} as const;

export const toolbarLabels = {
  mainPanel: '工作台',
  viewSwitch: '视图切换',
  board: '看板',
  list: '列表',
  today: '今日',
  completed: '完成',
  search: '搜索任务',
  searchPlaceholder: '搜索标题、备注、项目或标签',
  status: '当前工作台状态',
  filterChips: '当前筛选条件',
  noFilters: '未启用筛选',
  clearFilters: '清空筛选',
  project: '按项目筛选',
  label: '按标签筛选',
  hideCompleted: '隐藏已完成任务',
  due: '按日期筛选',
  statusFilter: '按状态筛选',
  priority: '按优先级筛选',
  filters: '任务筛选',
  expandFilters: '展开筛选',
  collapseFilters: '收起筛选',
} as const;

export const bulkLabels = {
  bulkActions: '批量操作',
  selectedPrefix: '已选择',
  selectedSuffix: '个任务',
  complete: '批量完成',
  move: '批量移动状态',
  movePlaceholder: '移动到',
  delete: '批量删除',
  cancel: '取消选择',
} as const;

export const detailLabels = {
  detail: '任务详情',
  title: '详情标题',
  notes: '详情备注',
  collapse: '关闭详情面板',
  expand: '显示详情',
} as const;

export const emptyMessages = {
  board: '还没有任务。',
  today: '今天和逾期任务已处理完。',
  completed: '还没有已完成的任务。',
  filtered: '当前筛选没有匹配的任务。',
  detailBoard: '还没有可查看的任务。',
  detailToday: '今天和逾期任务已全部处理完。',
  detailCompleted: '还没有已完成的任务可查看。',
  detailFiltered: '当前筛选下没有可查看的任务。',
} as const;
