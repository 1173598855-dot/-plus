import { ChevronDown, ChevronUp, Download, Plus, Upload } from 'lucide-react';
import type { Ref } from 'react';
import { taskStatuses } from './taskDomain';
import { energyLabels, priorityLabels, quickAddLabels, statusLabels } from './taskUiText';
import type { TaskDraft, TaskEnergy, TaskPriority, TaskStatus, TaskSummary } from './taskTypes';

export interface TaskQuickAddProps {
  summary: TaskSummary;
  draft: TaskDraft;
  labelInput: string;
  titleInputRef: Ref<HTMLInputElement>;
  isExpanded: boolean;
  isInert: boolean;
  message: string;
  pendingImportCount: number;
  onDraftChange: (draft: TaskDraft) => void;
  onLabelInputChange: (value: string) => void;
  onExpandedChange: (isExpanded: boolean) => void;
  onAdd: () => void;
  onExport: () => void;
  onImport: (file: File | undefined) => void | Promise<void>;
  onReplaceImport: () => void;
  onMergeImport: () => void;
  onCancelImport: () => void;
}

export function TaskQuickAdd({
  summary,
  draft,
  labelInput,
  titleInputRef,
  isExpanded,
  isInert,
  message,
  pendingImportCount,
  onDraftChange,
  onLabelInputChange,
  onExpandedChange,
  onAdd,
  onExport,
  onImport,
  onReplaceImport,
  onMergeImport,
  onCancelImport,
}: TaskQuickAddProps) {
  return (
    <aside className="rail" aria-label={quickAddLabels.rail} inert={isInert || undefined}>
      <div className="brand-block">
        <span className="brand-mark">{quickAddLabels.brandMark}</span>
        <div>
          <h1>{quickAddLabels.brandTitle}</h1>
          <p>{quickAddLabels.brandSubtitle}</p>
        </div>
      </div>

      <section className="metric-grid" aria-label={quickAddLabels.metricsTitle}>
        <div>
          <strong>{summary.active}</strong>
          <span>{quickAddLabels.active}</span>
        </div>
        <div>
          <strong>{summary.dueToday}</strong>
          <span>{quickAddLabels.today}</span>
        </div>
        <div>
          <strong>{summary.overdue}</strong>
          <span>{quickAddLabels.overdue}</span>
        </div>
        <div>
          <strong>{summary.completed}</strong>
          <span>{quickAddLabels.completed}</span>
        </div>
      </section>

      <section className="quick-add" aria-label={quickAddLabels.quickAdd}>
        <h2>{quickAddLabels.quickAddTitle}</h2>
        <div className="quick-capture-row">
          <input ref={titleInputRef} aria-label={quickAddLabels.title} value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder={quickAddLabels.placeholder} />
          <button type="button" aria-label={isExpanded ? quickAddLabels.collapseDetails : quickAddLabels.expandDetails} aria-expanded={isExpanded} aria-controls="quick-add-fields" title={isExpanded ? quickAddLabels.collapseDetails : quickAddLabels.expandDetails} onClick={() => onExpandedChange(!isExpanded)}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button className="primary" type="button" onClick={onAdd} disabled={!draft.title?.trim()}>
            <Plus size={16} /> {quickAddLabels.addTask}
          </button>
        </div>
        {isExpanded && <div id="quick-add-fields" className="quick-add-fields">
          <textarea aria-label={quickAddLabels.notes} value={draft.notes} onChange={(event) => onDraftChange({ ...draft, notes: event.target.value })} placeholder={quickAddLabels.notesPlaceholder} />
          <div className="form-row">
            <select aria-label={quickAddLabels.status} value={draft.status} onChange={(event) => onDraftChange({ ...draft, status: event.target.value as TaskStatus })}>
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            <select aria-label={quickAddLabels.priority} value={draft.priority} onChange={(event) => onDraftChange({ ...draft, priority: event.target.value as TaskPriority })}>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <input aria-label={quickAddLabels.dueDate} type="date" value={draft.dueDate} onChange={(event) => onDraftChange({ ...draft, dueDate: event.target.value })} />
          <div className="form-row">
            <input
              aria-label={quickAddLabels.estimate}
              type="number"
              min="0"
              step="5"
              value={draft.estimateMinutes || ''}
              onChange={(event) => onDraftChange({ ...draft, estimateMinutes: Number(event.target.value) || 0 })}
              placeholder={quickAddLabels.estimatePlaceholder}
            />
            <select aria-label={quickAddLabels.energy} value={draft.energy} onChange={(event) => onDraftChange({ ...draft, energy: event.target.value as TaskEnergy })}>
              {Object.entries(energyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <input aria-label={quickAddLabels.project} value={draft.project} onChange={(event) => onDraftChange({ ...draft, project: event.target.value })} placeholder={quickAddLabels.projectPlaceholder} />
          <input aria-label={quickAddLabels.labels} value={labelInput} onChange={(event) => onLabelInputChange(event.target.value)} placeholder={quickAddLabels.labelsPlaceholder} />
        </div>}
        <div className="backup-actions" aria-label={quickAddLabels.backupTitle}>
          <button className="secondary-action" type="button" onClick={onExport}>
            <Download size={16} /> {quickAddLabels.export}
          </button>
          <label className="secondary-action file-action">
            <Upload size={16} /> {quickAddLabels.import}
            <input aria-label={quickAddLabels.importInput} type="file" accept="application/json,.json" onChange={(event) => void onImport(event.target.files?.[0])} />
          </label>
        </div>
        {message && (
          <p className="message" role="status" aria-live="polite">
            {message}
          </p>
        )}
        {pendingImportCount > 0 && (
          <div className="import-actions" aria-label={quickAddLabels.importTitle}>
            <button className="secondary-action" type="button" onClick={onReplaceImport}>
              {quickAddLabels.replace}
            </button>
            <button className="secondary-action" type="button" onClick={onMergeImport}>
              {quickAddLabels.merge}
            </button>
            <button className="clear-filter" type="button" onClick={onCancelImport}>
              {quickAddLabels.cancel}
            </button>
          </div>
        )}
      </section>
    </aside>
  );
}
