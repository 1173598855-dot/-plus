import { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { nowIso, todayIso } from '../../lib/date';
import { createId } from '../../lib/id';
import { readJson, saveJson } from '../../lib/storage';
import { createTask, deleteTask, filterTasks, groupTasksByStatus, moveTask, nextTaskSortOrder, normalizeTasks, sortTasks, summarizeTasks, updateTask } from './taskDomain';
import { decodeTaskArray, exportTasksToJson, importTasksFromJson } from './taskBackup';
import { taskSchemaLimits } from './taskSchema';
import { seedTasks } from './seedTasks';
import { TaskBulkActions } from './TaskBulkActions';
import { detailHeadingId, TaskDetailPanel } from './TaskDetailPanel';
import { TaskQuickAdd } from './TaskQuickAdd';
import { TaskToolbar } from './TaskToolbar';
import type { TaskViewMode } from './TaskToolbar';
import { TaskViews } from './TaskViews';
import { columnQuickAddLabels, dueFilterLabels, emptyMessages, labelsFromInput, operationMessages, priorityLabels, statusLabels, toolbarLabels, workspaceLabels } from './taskUiText';
import type { Task, TaskDraft, TaskFilters, TaskPriority, TaskStatus } from './taskTypes';

const storageKey = 'personal-task-manager.tasks.v1';
const maxImportBytes = 5 * 1024 * 1024;

interface TaskStorageState {
  tasks: Task[];
  recoveryRaw: string | null;
  recoveryBlocked: boolean;
  hasStoredTasks: boolean;
}

function readStoredTasks(): TaskStorageState {
  const result = readJson<unknown>(storageKey);
  if (result.status === 'success') {
    const tasks = decodeTaskArray(result.value);
    return tasks === undefined ? { tasks: normalizeTasks(seedTasks), recoveryRaw: result.raw, recoveryBlocked: true, hasStoredTasks: false } : { tasks, recoveryRaw: null, recoveryBlocked: false, hasStoredTasks: true };
  }
  if (result.status === 'invalid') return { tasks: normalizeTasks(seedTasks), recoveryRaw: result.raw, recoveryBlocked: true, hasStoredTasks: false };
  if (result.status === 'unavailable') return { tasks: normalizeTasks(seedTasks), recoveryRaw: null, recoveryBlocked: true, hasStoredTasks: false };
  return { tasks: normalizeTasks(seedTasks), recoveryRaw: null, recoveryBlocked: false, hasStoredTasks: false };
}

const emptyDraft: TaskDraft = { title: '', notes: '', status: 'inbox', priority: 'medium', dueDate: '', project: '', labels: [], estimateMinutes: 0, energy: 'medium' };

const handledDropType = 'application/x-task-drop-handled';
const cardDropType = 'application/x-task-card-drop';
const drawerFocusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function TaskWorkspace() {
  const [startup] = useState(readStoredTasks);
  const [tasks, setTasks] = useState<Task[]>(startup.tasks);
  const [recoveryRaw, setRecoveryRaw] = useState<string | null>(startup.recoveryRaw);
  const [recoveryBlocked, setRecoveryBlocked] = useState(startup.recoveryBlocked);
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft);
  const [labelInput, setLabelInput] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({ status: 'all', priority: 'all', due: 'all' });
  const [viewMode, setViewMode] = useState<TaskViewMode>('board');
  const [selectedId, setSelectedId] = useState<string>('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [pendingImport, setPendingImport] = useState<Task[] | null>(null);
  const [message, setMessage] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState('');
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | ''>('');
  const [isQuickAddExpanded, setIsQuickAddExpanded] = useState(false);
  const [isMobileFiltersExpanded, setIsMobileFiltersExpanded] = useState(false);
  const projects = useMemo(() => [...new Set(tasks.map((task) => task.project).filter(Boolean))], [tasks]);
  const labelOptions = useMemo(() => [...new Set(tasks.flatMap((task) => task.labels))], [tasks]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const detailLayerRef = useRef<HTMLDivElement>(null);
  const detailCloseButtonRef = useRef<HTMLButtonElement>(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const importRequestRef = useRef(0);
  const [today, setToday] = useState(todayIso);

  useEffect(() => () => {
    importRequestRef.current += 1;
  }, []);

  useEffect(() => {
    let midnightTimer = 0;

    function scheduleMidnightRefresh() {
      window.clearTimeout(midnightTimer);
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      midnightTimer = window.setTimeout(refreshToday, nextMidnight.getTime() - now.getTime());
    }

    function refreshToday() {
      setToday(todayIso());
      scheduleMidnightRefresh();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') refreshToday();
    }

    scheduleMidnightRefresh();
    window.addEventListener('focus', refreshToday);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearTimeout(midnightTimer);
      window.removeEventListener('focus', refreshToday);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (recoveryBlocked) return;
    try {
      saveJson(storageKey, tasks);
    } catch {
      setRecoveryBlocked(true);
      setMessage(operationMessages.storageUnavailable);
    }
  }, [recoveryBlocked, tasks]);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    }

    function handleShortcut(event: KeyboardEvent) {
      if (showDetail) return;

      if (event.key === 'Escape' && isTypingTarget(event.target)) {
        (event.target as HTMLElement).blur();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || isTypingTarget(event.target)) return;

      if (event.key === '/') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (event.key.toLowerCase() === 'n') {
        setIsQuickAddExpanded(true);
        window.requestAnimationFrame(() => titleInputRef.current?.focus());
        return;
      }
      if (event.key === '1') setViewMode('board');
      if (event.key === '2') setViewMode('list');
      if (event.key === '3') setViewMode('today');
      if (event.key === '4') setViewMode('completed');
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [showDetail]);

  useEffect(() => {
    if (!showDetail) return;
    const dialog = detailLayerRef.current;
    if (!dialog) return;
    const trigger = detailTriggerRef.current;

    detailCloseButtonRef.current?.focus();

    function handleModalKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setShowDetail(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableElements = Array.from(dialog?.querySelectorAll<HTMLElement>(drawerFocusableSelector) ?? []);
      const first = focusableElements[0];
      const last = focusableElements.at(-1);
      if (!first || !last) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleModalKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleModalKeyDown, true);
      if (trigger?.isConnected) trigger.focus();
      detailTriggerRef.current = null;
    };
  }, [showDetail]);

  const sortedTasks = useMemo(() => sortTasks(tasks, today), [tasks, today]);
  const filteredTasks = useMemo(() => {
    const visibleTasks = hideCompleted ? sortedTasks.filter((task) => task.status !== 'done') : sortedTasks;
    return filterTasks(visibleTasks, filters, today);
  }, [filters, hideCompleted, sortedTasks, today]);
  const groups = useMemo(() => groupTasksByStatus(filteredTasks), [filteredTasks]);
  const todayTasks = useMemo(() => filteredTasks.filter((task) => task.status !== 'done' && task.dueDate && task.dueDate <= today), [filteredTasks, today]);
  const completedTasks = useMemo(() => {
    if (hideCompleted) return [];
    return filterTasks(
      sortTasks(
        tasks.filter((task) => task.status === 'done'),
        today,
      ),
      filters,
      today,
    );
  }, [filters, hideCompleted, tasks, today]);
  const summary = useMemo(() => summarizeTasks(tasks, today), [tasks, today]);

  const visibleDetailTasks = useMemo(() => {
    if (viewMode === 'today') return todayTasks;
    if (viewMode === 'completed') return completedTasks;
    return filteredTasks;
  }, [completedTasks, filteredTasks, todayTasks, viewMode]);
  const selectedTask = visibleDetailTasks.find((task) => task.id === selectedId) ?? visibleDetailTasks[0];
  const visibleSelectedTaskIds = useMemo(() => visibleDetailTasks.filter((task) => selectedTaskIds.includes(task.id)).map((task) => task.id), [selectedTaskIds, visibleDetailTasks]);

  useEffect(() => {
    const taskIds = new Set(tasks.map((task) => task.id));

    setSelectedTaskIds((current) => {
      const next = current.filter((id) => taskIds.has(id));
      return next.length === current.length ? current : next;
    });
    setSelectedId((current) => (current && taskIds.has(current) ? current : tasks[0]?.id ?? ''));
  }, [tasks]);

  useEffect(() => {
    const visibleTaskIds = new Set(visibleDetailTasks.map((task) => task.id));

    setSelectedTaskIds((current) => {
      const next = current.filter((id) => visibleTaskIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [visibleDetailTasks]);

  const hasActiveFilters =
    Boolean(filters.search?.trim()) ||
    (filters.status ?? 'all') !== 'all' ||
    (filters.priority ?? 'all') !== 'all' ||
    (filters.due ?? 'all') !== 'all' ||
    Boolean(filters.project) ||
    Boolean(filters.label) ||
    hideCompleted;
  const workspaceScopeTasks =
    viewMode === 'today' ? sortedTasks.filter((task) => task.status !== 'done' && task.dueDate && task.dueDate <= today) : viewMode === 'completed' ? tasks.filter((task) => task.status === 'done') : sortedTasks;
  const workspaceVisibleTasks = viewMode === 'completed' ? completedTasks : viewMode === 'today' ? todayTasks : filteredTasks;
  const activeFilterLabels = [
    filters.search?.trim() ? toolbarLabels.searchFilter(filters.search.trim()) : '',
    (filters.status ?? 'all') !== 'all' ? toolbarLabels.statusFilterValue(statusLabels[filters.status as TaskStatus]) : '',
    (filters.priority ?? 'all') !== 'all' ? toolbarLabels.priorityFilter(priorityLabels[filters.priority as TaskPriority]) : '',
    (filters.due ?? 'all') !== 'all' ? toolbarLabels.dueFilter(dueFilterLabels[filters.due ?? 'all']) : '',
    filters.project ? toolbarLabels.projectFilter(filters.project) : '',
    filters.label ? toolbarLabels.labelFilter(filters.label) : '',
    hideCompleted ? toolbarLabels.hideCompleted : '',
  ].filter(Boolean);
  const workspaceStatus = hasActiveFilters ? toolbarLabels.filteredStatus(workspaceVisibleTasks.length, workspaceScopeTasks.length) : toolbarLabels.allStatus(workspaceScopeTasks.length);

  function resetDraft() {
    setDraft(emptyDraft);
    setLabelInput('');
  }

  function openDetail(task?: Task, trigger?: HTMLElement) {
    detailTriggerRef.current = trigger ?? null;
    if (task) setSelectedId(task.id);
    setShowDetail(true);
  }

  function closeDetail() {
    setShowDetail(false);
  }

  function addTask() {
    const task = createTask({ ...draft, labels: labelsFromInput(labelInput) }, { id: createId(), now: nowIso() });
    setTasks((current) => [task, ...current]);
    setSelectedId(task.id);
    setMessage(recoveryBlocked ? operationMessages.storageUnavailable : operationMessages.taskCreated(task.title));
    resetDraft();
  }

  function addTaskToColumn(title: string, status: TaskStatus) {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;
    const clock = { id: createId(), now: nowIso() };
    setTasks((current) => {
      const columnTasks = current.filter((task) => task.status === status).sort((left, right) => left.sortOrder - right.sortOrder);
      const sortOrder = nextTaskSortOrder(current, status);
      if (columnTasks.length && sortOrder <= columnTasks.at(-1)!.sortOrder) {
        const normalizedOrders = new Map(columnTasks.map((task, index) => [task.id, (index + 1) * 1000]));
        const normalizedTasks = current.map((task) => normalizedOrders.has(task.id) ? { ...task, sortOrder: normalizedOrders.get(task.id)! } : task);
        return [...normalizedTasks, createTask({ title: normalizedTitle, status, sortOrder: (columnTasks.length + 1) * 1000 }, clock)];
      }
      return [...current, createTask({ title: normalizedTitle, status, sortOrder }, clock)];
    });
    setSelectedId(clock.id);
    setMessage(columnQuickAddLabels.created(statusLabels[status], normalizedTitle));
  }

  function patchTask(task: Task, patch: Partial<TaskDraft>) {
    setTasks((current) => current.map((item) => (item.id === task.id ? updateTask(item, patch, nowIso()) : item)));
  }

  function toggleDone(task: Task) {
    patchTask(task, { status: task.status === 'done' ? 'next' : 'done' });
  }

  function removeTask(task: Task) {
    setTasks((current) => deleteTask(current, task.id));
    if (selectedId === task.id) setSelectedId('');
  }

  function clearFilters() {
    setFilters({ status: 'all', priority: 'all', due: 'all', search: '', project: '', label: '' });
    setHideCompleted(false);
  }

  function toggleTaskSelection(taskId: string) {
    setSelectedTaskIds((current) => (current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]));
  }

  function clearSelection() {
    setSelectedTaskIds([]);
  }

  function completeSelectedTasks() {
    const completedAt = nowIso();
    setTasks((current) => current.map((task) => (visibleSelectedTaskIds.includes(task.id) ? updateTask(task, { status: 'done' }, completedAt) : task)));
    setMessage(operationMessages.tasksCompleted(visibleSelectedTaskIds.length));
    clearSelection();
  }

  function moveSelectedTasks(status: TaskStatus) {
    const movedAt = nowIso();
    setTasks((current) => current.map((task) => (visibleSelectedTaskIds.includes(task.id) ? updateTask(task, { status }, movedAt) : task)));
    setMessage(operationMessages.tasksMoved(visibleSelectedTaskIds.length, statusLabels[status]));
    clearSelection();
  }

  function deleteSelectedTasks() {
    const deletedCount = visibleSelectedTaskIds.length;
    setTasks((current) => current.filter((task) => !visibleSelectedTaskIds.includes(task.id)));
    if (visibleSelectedTaskIds.includes(selectedId)) setSelectedId('');
    setMessage(operationMessages.tasksDeleted(deletedCount));
    clearSelection();
  }

  function exportTasks() {
    const blob = new Blob([exportTasksToJson(tasks)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `personal-tasks-${today}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setMessage(operationMessages.exported);
  }

  function downloadRecoveryData() {
    if (recoveryRaw === null) return;
    const blob = new Blob([recoveryRaw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `personal-tasks-damaged-${today}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function retryStorage() {
    const next = readStoredTasks();
    if (!next.recoveryBlocked) {
      if (next.hasStoredTasks) setTasks(next.tasks);
      setRecoveryRaw(null);
      setRecoveryBlocked(false);
      return;
    }
    setRecoveryRaw((current) => current ?? next.recoveryRaw);
    setRecoveryBlocked(true);
    setMessage(operationMessages.storageUnavailable);
  }

  function resetStorage() {
    setRecoveryRaw(null);
    setRecoveryBlocked(false);
  }

  async function importTasks(file: File | undefined) {
    const requestId = ++importRequestRef.current;
    if (!file) return;
    setPendingImport(null);
    setMessage('');
    if (file.size > maxImportBytes) {
      setMessage(operationMessages.importTooLarge);
      return;
    }
    try {
      const raw = await file.text();
      if (requestId !== importRequestRef.current) return;
      const importedTasks = importTasksFromJson(raw);
      setPendingImport(importedTasks);
      setMessage(operationMessages.importReady(importedTasks.length));
    } catch (error) {
      if (requestId !== importRequestRef.current) return;
      setPendingImport(null);
      setMessage(error instanceof Error ? error.message : operationMessages.importFailed);
    }
  }

  function replaceTasksWithImport() {
    if (pendingImport === null) return;
    setTasks(pendingImport);
    setRecoveryRaw(null);
    setRecoveryBlocked(false);
    setSelectedTaskIds([]);
    setSelectedId(pendingImport[0]?.id ?? '');
    setMessage(operationMessages.importReplaced(pendingImport.length));
    setPendingImport(null);
  }

  function mergeImportedTasks() {
    if (pendingImport === null) return;
    const existingIds = new Set(tasks.map((task) => task.id));
    const tasksToAdd = pendingImport.filter((task) => !existingIds.has(task.id));
    if (tasks.length + tasksToAdd.length > taskSchemaLimits.maxTasks) {
      setMessage(operationMessages.importMergeTooLarge);
      return;
    }
    setTasks((current) => [...tasksToAdd, ...current]);
    setSelectedId(tasksToAdd[0]?.id ?? selectedId);
    setRecoveryRaw(null);
    setRecoveryBlocked(false);
    setMessage(operationMessages.importMerged(tasksToAdd.length, pendingImport.length - tasksToAdd.length));
    setPendingImport(null);
  }

  function cancelImport() {
    importRequestRef.current += 1;
    setPendingImport(null);
    setMessage(operationMessages.importCanceled);
  }

  function handleTaskDragStart(event: DragEvent<HTMLElement>, task: Task) {
    setDraggedTaskId(task.id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', task.id);
  }

  function handleTaskDragEnd() {
    setDraggedTaskId('');
    setDragOverStatus('');
  }

  function handleTaskDragOver(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  }

  function handleColumnDragLeave() {
    setDragOverStatus('');
  }

  function handleColumnDragOver(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  }

  function handleColumnDrop(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    if (event.dataTransfer.getData(handledDropType) || event.dataTransfer.getData(cardDropType)) return;
    const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId;
    const task = tasks.find((item) => item.id === taskId);
    setDraggedTaskId('');
    setDragOverStatus('');
    if (!task || task.status === status) return;

    const updatedAt = nowIso();
    setTasks((current) => {
      const targetIndex = current.filter((item) => item.status === status && item.id !== taskId).length;
      return moveTask(current, taskId, status, targetIndex, updatedAt);
    });
    setSelectedId(taskId);
    setMessage(operationMessages.taskMovedToStatus(task.title, statusLabels[status]));
  }

  function handleTaskDrop(event: DragEvent<HTMLElement>, targetTask: Task) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.setData(handledDropType, 'true');
    event.dataTransfer.setData(cardDropType, 'true');
    const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId;
    const task = tasks.find((item) => item.id === taskId);
    setDraggedTaskId('');
    setDragOverStatus('');
    if (!task || task.id === targetTask.id) return;

    const movedAt = nowIso();
    setTasks((current) => {
      const currentGroups = groupTasksByStatus(sortTasks(current, today));
      const targetTasks = currentGroups[targetTask.status].filter((item) => item.id !== taskId);
      const targetIndex = Math.max(
        0,
        targetTasks.findIndex((item) => item.id === targetTask.id),
      );
      return moveTask(current, taskId, targetTask.status, targetIndex, movedAt);
    });
    setSelectedId(taskId);
    setMessage(operationMessages.taskMovedBefore(task.title, targetTask.title));
  }

  function getDetailEmptyStateMessage(currentViewMode: TaskViewMode) {
    if (hasActiveFilters) return emptyMessages.detailFiltered;
    if (currentViewMode === 'completed') return emptyMessages.detailCompleted;
    if (currentViewMode === 'today') return emptyMessages.detailToday;
    return emptyMessages.detailBoard;
  }

  return (
    <main className="workspace">
      <TaskQuickAdd
        summary={summary}
        draft={draft}
        labelInput={labelInput}
        titleInputRef={titleInputRef}
        isExpanded={isQuickAddExpanded}
        isInert={showDetail}
        message={message}
        hasPendingImport={pendingImport !== null}
        recoveryRaw={recoveryRaw}
        recoveryBlocked={recoveryBlocked}
        onDraftChange={setDraft}
        onLabelInputChange={setLabelInput}
        onExpandedChange={setIsQuickAddExpanded}
        onAdd={addTask}
        onExport={exportTasks}
        onImport={importTasks}
        onReplaceImport={replaceTasksWithImport}
        onMergeImport={mergeImportedTasks}
        onCancelImport={cancelImport}
        onDownloadRecovery={downloadRecoveryData}
        onRetryStorage={retryStorage}
        onResetStorage={resetStorage}
      />

      <section className="main-panel" aria-label={toolbarLabels.mainPanel} inert={showDetail || undefined}>
        <TaskToolbar
          viewMode={viewMode}
          searchInputRef={searchInputRef}
          filters={filters}
          workspaceStatus={workspaceStatus}
          activeFilterLabels={activeFilterLabels}
          activeFilterCount={activeFilterLabels.length}
          hasActiveFilters={hasActiveFilters}
          showDetail={showDetail}
          projects={projects}
          labelOptions={labelOptions}
          hideCompleted={hideCompleted}
          isMobileFiltersExpanded={isMobileFiltersExpanded}
          bulkActions={(
            <TaskBulkActions
              selectedCount={visibleSelectedTaskIds.length}
              onComplete={completeSelectedTasks}
              onMove={moveSelectedTasks}
              onDelete={deleteSelectedTasks}
              onClear={clearSelection}
            />
          )}
          onViewModeChange={setViewMode}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
          onShowDetailChange={(isOpen, trigger) => (isOpen ? openDetail(undefined, trigger) : closeDetail())}
          onHideCompletedChange={setHideCompleted}
          onMobileFiltersExpandedChange={setIsMobileFiltersExpanded}
        />

        <div className="content-grid" aria-label={workspaceLabels.canvas}>
          <TaskViews
            viewMode={viewMode}
            filteredTasks={filteredTasks}
            todayTasks={todayTasks}
            completedTasks={completedTasks}
            groups={groups}
            selectedTask={selectedTask}
            selectedTaskIds={selectedTaskIds}
            draggedTaskId={draggedTaskId}
            dragOverStatus={dragOverStatus}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onToggleTaskSelection={toggleTaskSelection}
            onToggleDone={toggleDone}
            onOpenDetail={openDetail}
            onTaskDragStart={handleTaskDragStart}
            onTaskDragEnd={handleTaskDragEnd}
            onTaskDragOver={handleTaskDragOver}
            onTaskDrop={handleTaskDrop}
            onColumnDragOver={handleColumnDragOver}
            onColumnDragLeave={handleColumnDragLeave}
            onColumnDrop={handleColumnDrop}
            onAddTaskToColumn={addTaskToColumn}
          />

        </div>
      </section>
      {showDetail && (
        <div
          ref={detailLayerRef}
          className="detail-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby={detailHeadingId}
          aria-label={workspaceLabels.detailLayer}
        >
          <div className="detail-scrim" aria-hidden="true" onClick={closeDetail} />
          <TaskDetailPanel
            task={selectedTask}
            emptyMessage={getDetailEmptyStateMessage(viewMode)}
            closeButtonRef={detailCloseButtonRef}
            onPatch={patchTask}
            onRemove={removeTask}
            onClose={closeDetail}
          />
        </div>
      )}
    </main>
  );
}
