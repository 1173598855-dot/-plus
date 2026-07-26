import { CheckCircle2, Circle, PanelRightOpen } from 'lucide-react';
import type { DragEvent } from 'react';
import { formatDate } from '../../lib/date';
import { taskStatuses } from './taskDomain';
import { TaskEmptyState, type EmptyStateVariant } from './TaskEmptyState';
import type { TaskViewMode } from './TaskToolbar';
import { emptyMessages, energyLabels, formatEstimate, priorityLabels, statusLabels } from './taskUiText';
import type { Task, TaskGroups, TaskStatus } from './taskTypes';

export interface TaskViewsProps {
  viewMode: TaskViewMode;
  filteredTasks: Task[];
  todayTasks: Task[];
  completedTasks: Task[];
  groups: TaskGroups;
  selectedTask: Task | undefined;
  selectedTaskIds: string[];
  draggedTaskId: string;
  dragOverStatus: TaskStatus | '';
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onToggleTaskSelection: (taskId: string) => void;
  onToggleDone: (task: Task) => void;
  onOpenDetail: (task: Task, trigger?: HTMLElement) => void;
  onTaskDragStart: (event: DragEvent<HTMLElement>, task: Task) => void;
  onTaskDragEnd: () => void;
  onTaskDragOver: (event: DragEvent<HTMLElement>, status: TaskStatus) => void;
  onTaskDrop: (event: DragEvent<HTMLElement>, task: Task) => void;
  onColumnDragOver: (event: DragEvent<HTMLElement>, status: TaskStatus) => void;
  onColumnDragLeave: () => void;
  onColumnDrop: (event: DragEvent<HTMLElement>, status: TaskStatus) => void;
}

export function TaskViews({
  viewMode,
  filteredTasks,
  todayTasks,
  completedTasks,
  groups,
  selectedTask,
  selectedTaskIds,
  draggedTaskId,
  dragOverStatus,
  hasActiveFilters,
  onClearFilters,
  onToggleTaskSelection,
  onToggleDone,
  onOpenDetail,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDragOver,
  onTaskDrop,
  onColumnDragOver,
  onColumnDragLeave,
  onColumnDrop,
}: TaskViewsProps) {
  function renderTaskCard(task: Task) {
    return (
      <article
        className={`task-card ${selectedTask?.id === task.id ? 'selected' : ''} ${draggedTaskId === task.id ? 'dragging' : ''}`}
        key={task.id}
        draggable
        onDragStart={(event) => onTaskDragStart(event, task)}
        onDragEnd={onTaskDragEnd}
        onDragOver={(event) => onTaskDragOver(event, task.status)}
        onDrop={(event) => onTaskDrop(event, task)}
        onClick={() => onOpenDetail(task)}
      >
        <label className="select-task" onClick={(event) => event.stopPropagation()}>
          <input type="checkbox" aria-label={`选择任务：${task.title}`} checked={selectedTaskIds.includes(task.id)} onChange={() => onToggleTaskSelection(task.id)} />
        </label>
        <button
          className="icon-button"
          type="button"
          aria-label={`切换完成：${task.title}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleDone(task);
          }}
        >
          {task.status === 'done' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </button>
        <div>
          <h3>{task.title}</h3>
          <p>{task.notes || task.project || '没有备注或项目。'}</p>
          <div className="task-meta">
            <span className={`priority ${task.priority}`}>{priorityLabels[task.priority]}</span>
            <span>{formatDate(task.dueDate)}</span>
            <span>{formatEstimate(task.estimateMinutes)}</span>
            <span>{energyLabels[task.energy]}</span>
            {task.project && <span>{task.project}</span>}
          </div>
        </div>
        <button
          className="icon-button task-detail-button"
          type="button"
          aria-label={`查看详情：${task.title}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpenDetail(task, event.currentTarget);
          }}
        >
          <PanelRightOpen size={16} />
        </button>
      </article>
    );
  }

  function getEmptyStateVariant(semanticVariant: Exclude<EmptyStateVariant, 'filtered'>): EmptyStateVariant {
    if (hasActiveFilters) return 'filtered';
    return semanticVariant;
  }

  function getEmptyStateMessage(variant: EmptyStateVariant) {
    if (hasActiveFilters) return emptyMessages.filtered;
    if (variant === 'completed') return emptyMessages.completed;
    if (variant === 'today') return emptyMessages.today;
    return emptyMessages.board;
  }

  function renderList(tasksToRender: Task[], label: string, semanticVariant: Exclude<EmptyStateVariant, 'filtered'>) {
    const emptyStateVariant = getEmptyStateVariant(semanticVariant);
    const emptyStateMessage = getEmptyStateMessage(emptyStateVariant);

    return (
      <section className="task-table" aria-label={label}>
        {tasksToRender.length ? (
          <>
            <div className="table-head" aria-hidden="true">
              <span />
              <span />
              <span>任务</span>
              <span>状态</span>
              <span>优先级</span>
              <span>日期</span>
              <span>预计</span>
              <span />
            </div>
            {tasksToRender.map((task) => (
              <article className={`table-row ${selectedTask?.id === task.id ? 'selected' : ''}`} key={task.id} onClick={() => onOpenDetail(task)}>
                <label className="select-task" onClick={(event) => event.stopPropagation()}>
                  <input type="checkbox" aria-label={`选择任务：${task.title}`} checked={selectedTaskIds.includes(task.id)} onChange={() => onToggleTaskSelection(task.id)} />
                </label>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`切换完成：${task.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleDone(task);
                  }}
                >
                  {task.status === 'done' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.notes || task.project || '没有备注或项目。'}</span>
                </div>
                <span>{statusLabels[task.status]}</span>
                <span className={`priority ${task.priority}`}>{priorityLabels[task.priority]}</span>
                <span>{formatDate(task.dueDate)}</span>
                <span>{formatEstimate(task.estimateMinutes)}</span>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`查看详情：${task.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenDetail(task, event.currentTarget);
                  }}
                >
                  <PanelRightOpen size={16} />
                </button>
              </article>
            ))}
          </>
        ) : (
          <TaskEmptyState
            variant={emptyStateVariant}
            message={emptyStateMessage}
            showClearFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
          />
        )}
      </section>
    );
  }

  return (
    <>
      {viewMode === 'board' && (
        <section className="board" aria-label="状态看板">
          {filteredTasks.length === 0 && (
            <TaskEmptyState
              className="board-empty"
              variant={hasActiveFilters ? 'filtered' : 'board'}
              message={hasActiveFilters ? emptyMessages.filtered : emptyMessages.board}
              showClearFilters={hasActiveFilters}
              onClearFilters={onClearFilters}
            />
          )}
          {taskStatuses.map((status) => (
            <div
              className={`column ${dragOverStatus === status ? 'drop-target' : ''}`}
              key={status}
              aria-label={`${statusLabels[status]}栏`}
              onDragOver={(event) => onColumnDragOver(event, status)}
              onDragLeave={onColumnDragLeave}
              onDrop={(event) => onColumnDrop(event, status)}
            >
              <div className="column-title">
                <h2>{statusLabels[status]}</h2>
                <span>{groups[status].length}</span>
              </div>
              <div className="task-stack">{[...groups[status]].sort((left, right) => left.sortOrder - right.sortOrder).map((task) => renderTaskCard(task))}</div>
            </div>
          ))}
        </section>
      )}
      {viewMode === 'list' && renderList(filteredTasks, '任务列表', 'board')}
      {viewMode === 'today' && renderList(todayTasks, '今日任务', 'today')}
      {viewMode === 'completed' && renderList(completedTasks, '已完成任务', 'completed')}
    </>
  );
}
