import { taskStatuses } from './taskDomain';
import { bulkLabels, statusLabels } from './taskUiText';
import type { TaskStatus } from './taskTypes';

export interface TaskBulkActionsProps {
  selectedCount: number;
  onComplete: () => void;
  onMove: (status: TaskStatus) => void;
  onDelete: () => void;
  onClear: () => void;
}

export function TaskBulkActions({ selectedCount, onComplete, onMove, onDelete, onClear }: TaskBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-actions" aria-label={bulkLabels.bulkActions}>
      <span>
        {bulkLabels.selectedPrefix} {selectedCount} {bulkLabels.selectedSuffix}
      </span>
      <button className="secondary-action" type="button" onClick={onComplete}>
        {bulkLabels.complete}
      </button>
      <select
        aria-label={bulkLabels.move}
        defaultValue=""
        onChange={(event) => {
          if (!event.target.value) return;
          onMove(event.target.value as TaskStatus);
          event.target.value = '';
        }}
      >
        <option value="" disabled>
          {bulkLabels.movePlaceholder}
        </option>
        {taskStatuses.map((status) => (
          <option key={status} value={status}>
            {statusLabels[status]}
          </option>
        ))}
      </select>
      <button className="danger-action" type="button" onClick={onDelete}>
        {bulkLabels.delete}
      </button>
      <button className="clear-filter" type="button" onClick={onClear}>
        {bulkLabels.cancel}
      </button>
    </div>
  );
}
