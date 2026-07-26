import { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { nowIso, todayIso } from '../../lib/date';
import { createId } from '../../lib/id';
import { loadJson, saveJson } from '../../lib/storage';
import { createTask, deleteTask, filterTasks, groupTasksByStatus, moveTask, normalizeTasks, sortTasks, summarizeTasks, updateTask } from './taskDomain';
import { exportTasksToJson, importTasksFromJson } from './taskBackup';
import { seedTasks } from './seedTasks';
import { TaskBulkActions } from './TaskBulkActions';
import { TaskDetailPanel } from './TaskDetailPanel';
import { TaskQuickAdd } from './TaskQuickAdd';
import { TaskToolbar } from './TaskToolbar';
import type { TaskViewMode } from './TaskToolbar';
import { TaskViews } from './TaskViews';
import { dueFilterLabels, emptyMessages, labelsFromInput, priorityLabels, statusLabels, toolbarLabels } from './taskUiText';
import type { Task, TaskDraft, TaskFilters, TaskPriority, TaskStatus } from './taskTypes';

const storageKey = 'personal-task-manager.tasks.v1';

const emptyDraft: TaskDraft = { title: '', notes: '', status: 'inbox', priority: 'medium', dueDate: '', project: '', labels: [], estimateMinutes: 0, energy: 'medium' };

const handledDropType = 'application/x-task-drop-handled';
const cardDropType = 'application/x-task-card-drop';

export function TaskWorkspace() {
  const [tasks, setTasks] = useState<Task[]>(() => normalizeTasks(loadJson<Task[]>(storageKey, seedTasks)));
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft);
  const [labelInput, setLabelInput] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({ status: 'all', priority: 'all', due: 'all' });
  const [viewMode, setViewMode] = useState<TaskViewMode>('board');
  const [selectedId, setSelectedId] = useState<string>('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showDetail, setShowDetail] = useState(true);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [pendingImport, setPendingImport] = useState<Task[]>([]);
  const [message, setMessage] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState('');
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | ''>('');
  const [isQuickAddExpanded, setIsQuickAddExpanded] = useState(false);
  const [isMobileFiltersExpanded, setIsMobileFiltersExpanded] = useState(false);
  const projects = useMemo(() => [...new Set(tasks.map((task) => task.project).filter(Boolean))], [tasks]);
  const labelOptions = useMemo(() => [...new Set(tasks.flatMap((task) => task.labels))], [tasks]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const today = useMemo(() => todayIso(), []);

  useEffect(() => {
    try {
      saveJson(storageKey, tasks);
    } catch {
      setMessage('存储不可用，当前修改可能不会持久化。');
    }
  }, [pendingImport.length, tasks]);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    }

    function handleShortcut(event: KeyboardEvent) {
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
  }, []);

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
  const visibleDetailLabel = viewMode === 'today' ? '今日任务' : viewMode === 'completed' ? '已完成任务' : '状态看板';
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
    filters.search?.trim() ? `搜索：${filters.search.trim()}` : '',
    (filters.status ?? 'all') !== 'all' ? `状态：${statusLabels[filters.status as TaskStatus]}` : '',
    (filters.priority ?? 'all') !== 'all' ? `优先级：${priorityLabels[filters.priority as TaskPriority]}` : '',
    (filters.due ?? 'all') !== 'all' ? `日期：${dueFilterLabels[filters.due ?? 'all']}` : '',
    filters.project ? `项目：${filters.project}` : '',
    filters.label ? `标签：${filters.label}` : '',
    hideCompleted ? '隐藏已完成任务' : '',
  ].filter(Boolean);
  const workspaceStatus = hasActiveFilters ? `已筛选 ${workspaceVisibleTasks.length} / ${workspaceScopeTasks.length} 个任务` : `全部 ${workspaceScopeTasks.length} 个任务`;

  function sanitizeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function resetDraft() {
    setDraft(emptyDraft);
    setLabelInput('');
  }

  function addTask() {
    const task = createTask({ ...draft, labels: labelsFromInput(labelInput) }, { id: createId(), now: nowIso() });
    setTasks((current) => [task, ...current]);
    setSelectedId(task.id);
    setMessage(`已创建任务“${sanitizeHtml(task.title)}”。系统已持久化。`);
    resetDraft();
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
    setMessage(`已完成 ${visibleSelectedTaskIds.length} 个任务。`);
    clearSelection();
  }

  function moveSelectedTasks(status: TaskStatus) {
    const movedAt = nowIso();
    setTasks((current) => current.map((task) => (visibleSelectedTaskIds.includes(task.id) ? updateTask(task, { status }, movedAt) : task)));
    setMessage(`已移动 ${visibleSelectedTaskIds.length} 个任务到${sanitizeHtml(statusLabels[status])}。`);
    clearSelection();
  }

  function deleteSelectedTasks() {
    const deletedCount = visibleSelectedTaskIds.length;
    setTasks((current) => current.filter((task) => !visibleSelectedTaskIds.includes(task.id)));
    if (visibleSelectedTaskIds.includes(selectedId)) setSelectedId('');
    setMessage(`已删除 ${deletedCount} 个任务。`);
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
    setMessage('任务已导出。');
  }

  async function importTasks(file: File | undefined) {
    if (!file) return;
    try {
      const importedTasks = importTasksFromJson(await file.text());
      setPendingImport(importedTasks);
      setMessage(`准备导入 ${importedTasks.length} 个任务，请选择替换或合并。`);
    } catch (error) {
      setPendingImport([]);
      setMessage(error instanceof Error ? error.message : '导入失败。');
    }
  }

  function replaceTasksWithImport() {
    setTasks(pendingImport);
    setSelectedTaskIds([]);
    setSelectedId(pendingImport[0]?.id ?? '');
    setMessage(`已替换为 ${pendingImport.length} 个任务。`);
    setPendingImport([]);
  }

  function mergeImportedTasks() {
    const existingIds = new Set(tasks.map((task) => task.id));
    const tasksToAdd = pendingImport.filter((task) => !existingIds.has(task.id));
    setTasks((current) => [...tasksToAdd, ...current]);
    setSelectedId(tasksToAdd[0]?.id ?? selectedId);
    setMessage(`已合并 ${tasksToAdd.length} 个任务，跳过 ${pendingImport.length - tasksToAdd.length} 个重复任务。`);
    setPendingImport([]);
  }

  function cancelImport() {
    setPendingImport([]);
    setMessage('已取消导入。');
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
    const targetIndex = groups[status].length;
    setTasks((current) => moveTask(current, taskId, status, targetIndex, updatedAt));
    setSelectedId(taskId);
    setMessage(`已移动“${sanitizeHtml(task.title)}”到${sanitizeHtml(statusLabels[status])}。`);
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
    setMessage(`已移动“${task.title}”到“${targetTask.title}”前。`);
  }

  function getDetailEmptyStateMessage(label: string) {
    if (hasActiveFilters) return emptyMessages.detailFiltered;
    if (label === '已完成任务') return emptyMessages.detailCompleted;
    if (label === '今日任务') return emptyMessages.detailToday;
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
        message={message}
        pendingImportCount={pendingImport.length}
        onDraftChange={setDraft}
        onLabelInputChange={setLabelInput}
        onExpandedChange={setIsQuickAddExpanded}
        onAdd={addTask}
        onExport={exportTasks}
        onImport={importTasks}
        onReplaceImport={replaceTasksWithImport}
        onMergeImport={mergeImportedTasks}
        onCancelImport={cancelImport}
      />

      <section className="main-panel" aria-label={toolbarLabels.mainPanel}>
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
          onShowDetailChange={setShowDetail}
          onHideCompletedChange={setHideCompleted}
          onMobileFiltersExpandedChange={setIsMobileFiltersExpanded}
        />

        <div className={`content-grid ${showDetail ? '' : 'detail-collapsed'}`}>
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
            onSelectTask={setSelectedId}
            onToggleTaskSelection={toggleTaskSelection}
            onToggleDone={toggleDone}
            onOpenDetail={(task) => {
              setSelectedId(task.id);
              setShowDetail(true);
            }}
            onTaskDragStart={handleTaskDragStart}
            onTaskDragEnd={handleTaskDragEnd}
            onTaskDragOver={handleTaskDragOver}
            onTaskDrop={handleTaskDrop}
            onColumnDragOver={handleColumnDragOver}
            onColumnDragLeave={handleColumnDragLeave}
            onColumnDrop={handleColumnDrop}
          />

          {showDetail && (
            <TaskDetailPanel
              task={selectedTask}
              emptyMessage={getDetailEmptyStateMessage(visibleDetailLabel)}
              onPatch={patchTask}
              onRemove={removeTask}
              onClose={() => setShowDetail(false)}
            />
          )}
        </div>
      </section>
    </main>
  );
}
