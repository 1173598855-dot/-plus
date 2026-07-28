import { PanelRightClose, Trash2 } from 'lucide-react';
import { useEffect, useState, type Ref } from 'react';
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

interface DetailTextDraft {
  title: string;
  notes: string;
  project: string;
  labels: string;
}

function createTextDraft(task: Task | undefined): DetailTextDraft {
  return {
    title: task?.title ?? '',
    notes: task?.notes ?? '',
    project: task?.project ?? '',
    labels: labelsToInput(task?.labels ?? []),
  };
}

export function TaskDetailPanel({ task, emptyMessage, closeButtonRef, onPatch, onRemove, onClose }: TaskDetailPanelProps) {
  const [textDraft, setTextDraft] = useState(() => createTextDraft(task));

  useEffect(() => {
    setTextDraft(createTextDraft(task));
  }, [task?.id]);

  return (
    <aside className="detail">
      <div className="detail-header">
        <span id={detailHeadingId} role="heading" aria-level={2}>{detailLabels.detail}</span>
        <div className="detail-actions">
          <button ref={closeButtonRef} className="icon-button" type="button" onClick={onClose} aria-label={detailLabels.collapse}>
            <PanelRightClose size={16} />
          </button>
          {task && (
            <button className="danger" type="button" onClick={() => onRemove(task)} aria-label={detailLabels.remove(task.title)}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      {task ? (
        <>
          <input
            aria-label={detailLabels.title}
            value={textDraft.title}
            onChange={(event) => {
              const title = event.target.value;
              setTextDraft((current) => ({ ...current, title }));
              if (title.trim()) onPatch(task, { title });
            }}
            onBlur={() => setTextDraft((current) => ({ ...current, title: current.title.trim() || task.title }))}
          />
          <textarea
            aria-label={detailLabels.notes}
            value={textDraft.notes}
            onChange={(event) => {
              const notes = event.target.value;
              setTextDraft((current) => ({ ...current, notes }));
              onPatch(task, { notes });
            }}
            onBlur={() => setTextDraft((current) => ({ ...current, notes: current.notes.trim() }))}
          />
          <label>
            {detailLabels.status}
            <select value={task.status} onChange={(event) => onPatch(task, { status: event.target.value as TaskStatus })}>
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {detailLabels.priority}
            <select value={task.priority} onChange={(event) => onPatch(task, { priority: event.target.value as TaskPriority })}>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {detailLabels.dueDate}
            <input type="date" value={task.dueDate} onChange={(event) => onPatch(task, { dueDate: event.target.value })} />
          </label>
          <label>
            {detailLabels.estimate}
            <input type="number" min="0" step="5" value={task.estimateMinutes || ''} onChange={(event) => onPatch(task, { estimateMinutes: Number(event.target.value) || 0 })} />
          </label>
          <label>
            {detailLabels.energy}
            <select value={task.energy} onChange={(event) => onPatch(task, { energy: event.target.value as TaskEnergy })}>
              {Object.entries(energyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {detailLabels.project}
            <input
              value={textDraft.project}
              onChange={(event) => {
                const project = event.target.value;
                setTextDraft((current) => ({ ...current, project }));
                onPatch(task, { project });
              }}
              onBlur={() => setTextDraft((current) => ({ ...current, project: current.project.trim() }))}
            />
          </label>
          <label>
            {detailLabels.labels}
            <input
              value={textDraft.labels}
              onChange={(event) => {
                const labels = event.target.value;
                setTextDraft((current) => ({ ...current, labels }));
                onPatch(task, { labels: labelsFromInput(labels) });
              }}
              onBlur={() => setTextDraft((current) => ({ ...current, labels: labelsToInput(labelsFromInput(current.labels)) }))}
            />
          </label>
        </>
      ) : (
        <div className="empty-state">{emptyMessage}</div>
      )}
    </aside>
  );
}
