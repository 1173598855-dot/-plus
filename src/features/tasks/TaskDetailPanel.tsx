import { PanelRightClose, Trash2 } from 'lucide-react';
import type { Ref } from 'react';
import { taskStatuses } from './taskDomain';
import { detailLabels, energyLabels, labelsFromInput, labelsToInput, priorityLabels, statusLabels } from './taskUiText';
import type { Task, TaskDraft, TaskEnergy, TaskPriority, TaskStatus } from './taskTypes';

export interface TaskDetailPanelProps {
  task: Task | undefined;
  emptyMessage: string;
  closeButtonRef: Ref<HTMLButtonElement>;
  onPatch: (task: Task, patch: Partial<TaskDraft>) => void;
  onRemove: (task: Task) => void;
  onClose: () => void;
}

export const detailHeadingId = 'task-detail-heading';

export function TaskDetailPanel({ task, emptyMessage, closeButtonRef, onPatch, onRemove, onClose }: TaskDetailPanelProps) {
  return (
    <aside className="detail">
      <div className="detail-header">
        <span id={detailHeadingId} role="heading" aria-level={2}>{detailLabels.detail}</span>
        <div className="detail-actions">
          <button ref={closeButtonRef} className="icon-button" type="button" onClick={onClose} aria-label={detailLabels.collapse}>
            <PanelRightClose size={16} />
          </button>
          {task && (
            <button className="danger" type="button" onClick={() => onRemove(task)} aria-label={`删除：${task.title}`}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      {task ? (
        <>
          <input aria-label={detailLabels.title} value={task.title} onChange={(event) => onPatch(task, { title: event.target.value })} />
          <textarea aria-label={detailLabels.notes} value={task.notes} onChange={(event) => onPatch(task, { notes: event.target.value })} />
          <label>
            状态
            <select value={task.status} onChange={(event) => onPatch(task, { status: event.target.value as TaskStatus })}>
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label>
            优先级
            <select value={task.priority} onChange={(event) => onPatch(task, { priority: event.target.value as TaskPriority })}>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            截止日期
            <input type="date" value={task.dueDate} onChange={(event) => onPatch(task, { dueDate: event.target.value })} />
          </label>
          <label>
            预计用时（分钟）
            <input type="number" min="0" step="5" value={task.estimateMinutes || ''} onChange={(event) => onPatch(task, { estimateMinutes: Number(event.target.value) || 0 })} />
          </label>
          <label>
            精力类型
            <select value={task.energy} onChange={(event) => onPatch(task, { energy: event.target.value as TaskEnergy })}>
              {Object.entries(energyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            项目
            <input value={task.project} onChange={(event) => onPatch(task, { project: event.target.value })} />
          </label>
          <label>
            标签
            <input value={labelsToInput(task.labels)} onChange={(event) => onPatch(task, { labels: labelsFromInput(event.target.value) })} />
          </label>
        </>
      ) : (
        <div className="empty-state">{emptyMessage}</div>
      )}
    </aside>
  );
}
