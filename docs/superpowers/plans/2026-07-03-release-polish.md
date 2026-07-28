# Release Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing local-first task manager feel release-ready by tightening selection/import edge cases, splitting the large workspace UI into focused components, and updating project documentation.

**Architecture:** Keep `TaskWorkspace` as the state owner and orchestration component. Move presentational UI into sibling components under `src/features/tasks/`, passing explicit props and callbacks instead of duplicating state. Preserve `taskDomain.ts` and `taskBackup.ts` as the only homes for domain and import/export logic.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, lucide-react, browser localStorage.

## Global Constraints

- Do not introduce new dependencies.
- Preserve the restrained workbench visual identity from `DESIGN.md`.
- Keep user-facing app copy in Chinese.
- Preserve existing flows: create, edit, complete, reopen, delete, filter, switch views, import, export, drag tasks, reorder tasks, bulk operate, and collapse details.
- `npm test` and `npm run build` must pass before completion.
- Use current project style: small functions, explicit props, no unrelated refactors.

---

## File Structure

- Modify: `src/features/tasks/TaskWorkspace.tsx`
  - Remains the state owner for tasks, draft, filters, view mode, selected task, imports, messages, drag state, and callbacks.
  - Imports new presentational components.
- Create: `src/features/tasks/taskUiText.ts`
  - Owns reusable Chinese labels and formatting helpers currently embedded in `TaskWorkspace.tsx`.
- Create: `src/features/tasks/TaskQuickAdd.tsx`
  - Renders the sidebar quick-add form, backup controls, import confirmation controls, and message area.
- Create: `src/features/tasks/TaskToolbar.tsx`
  - Renders the view switch, search, filters, hide-completed toggle, clear-filter button, and detail toggle.
- Create: `src/features/tasks/TaskBulkActions.tsx`
  - Renders selected-count feedback and bulk complete/move/delete/cancel controls.
- Create: `src/features/tasks/TaskViews.tsx`
  - Renders board, list, today, and completed task views.
  - Exports `TaskCard` and `TaskList` only if useful for readability; otherwise keep them private in this file.
- Create: `src/features/tasks/TaskDetailPanel.tsx`
  - Renders editable selected task fields and detail actions.
- Modify: `src/features/tasks/TaskWorkspace.test.tsx`
  - Adds regression tests for stale selection cleanup and import replacement selection behavior.
  - Keeps existing tests green through the component split.
- Modify: `README.md`
  - Updates the project description and current boundary notes after the release polish pass.
- Modify: `docs/optimization-roadmap.md`
  - Adds the release polish phase as the next/completed phase depending on implementation progress.

---

### Task 1: Selection And Import Edge Cases

**Files:**
- Modify: `src/features/tasks/TaskWorkspace.test.tsx`
- Modify: `src/features/tasks/TaskWorkspace.tsx`

**Interfaces:**
- Consumes: existing `TaskWorkspace` UI labels, `localStorage`, and import JSON format from `taskBackup.ts`.
- Produces: workspace behavior where stale selected ids are removed when tasks are replaced or hidden by destructive changes.

- [ ] **Step 1: Add a failing test for import replacement clearing stale bulk selection**

Add this test near the other import tests in `src/features/tasks/TaskWorkspace.test.tsx`:

```tsx
  it('clears bulk selection when imported tasks replace the current task list', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const importedTask = {
      id: 'import-clean-selection',
      title: '替换后的干净任务',
      notes: '',
      status: 'next',
      priority: 'medium',
      dueDate: '',
      project: '',
      labels: [],
      createdAt: '2026-07-03T09:00:00.000Z',
      updatedAt: '2026-07-03T09:00:00.000Z',
      completedAt: '',
    };
    const file = new File(
      [JSON.stringify({ version: 1, exportedAt: '2026-07-03T09:00:00.000Z', tasks: [importedTask] })],
      'tasks.json',
      { type: 'application/json' },
    );

    await user.click(screen.getByLabelText('选择任务：整理本周重点任务'));
    expect(screen.getByText('已选择 1 个任务')).toBeInTheDocument();

    await user.upload(screen.getByLabelText('导入任务 JSON'), file);
    await user.click(await screen.findByRole('button', { name: '替换当前任务' }));

    expect(screen.queryByText('已选择 1 个任务')).not.toBeInTheDocument();
    expect(screen.getByText('替换后的干净任务')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npm test -- --run src/features/tasks/TaskWorkspace.test.tsx -t "clears bulk selection when imported tasks replace the current task list"
```

Expected result: FAIL because the bulk selection bar still shows a stale selected count after replacement.

- [ ] **Step 3: Clear selection when replacing tasks**

In `src/features/tasks/TaskWorkspace.tsx`, update `replaceTasksWithImport`:

```tsx
  function replaceTasksWithImport() {
    setTasks(pendingImport);
    setSelectedId(pendingImport[0]?.id ?? '');
    setSelectedTaskIds([]);
    setMessage(`已替换为 ${pendingImport.length} 个导入任务。`);
    setPendingImport([]);
  }
```

Keep the existing Chinese message if it already matches this text exactly after reading the file; the required behavior change is `setSelectedTaskIds([])`.

- [ ] **Step 4: Add a selected-id pruning effect**

In `src/features/tasks/TaskWorkspace.tsx`, after derived values such as `selectedTasks` are declared, add this effect:

```tsx
  useEffect(() => {
    const taskIds = new Set(tasks.map((task) => task.id));
    setSelectedTaskIds((current) => current.filter((id) => taskIds.has(id)));
    if (selectedId && !taskIds.has(selectedId)) setSelectedId(tasks[0]?.id ?? '');
  }, [selectedId, tasks]);
```

This keeps detail selection and bulk selection aligned with the actual task list after deletes, replacements, and imports.

- [ ] **Step 5: Run the focused test again**

Run:

```bash
npm test -- --run src/features/tasks/TaskWorkspace.test.tsx -t "clears bulk selection when imported tasks replace the current task list"
```

Expected result: PASS.

- [ ] **Step 6: Run the full task workspace test file**

Run:

```bash
npm test -- --run src/features/tasks/TaskWorkspace.test.tsx
```

Expected result: all tests in `TaskWorkspace.test.tsx` PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/features/tasks/TaskWorkspace.tsx src/features/tasks/TaskWorkspace.test.tsx
git commit -m "fix: clear stale task selections"
```

---

### Task 2: Split Presentational Task UI Components

**Files:**
- Create: `src/features/tasks/taskUiText.ts`
- Create: `src/features/tasks/TaskQuickAdd.tsx`
- Create: `src/features/tasks/TaskToolbar.tsx`
- Create: `src/features/tasks/TaskBulkActions.tsx`
- Create: `src/features/tasks/TaskViews.tsx`
- Create: `src/features/tasks/TaskDetailPanel.tsx`
- Modify: `src/features/tasks/TaskWorkspace.tsx`
- Test: `src/features/tasks/TaskWorkspace.test.tsx`

**Interfaces:**
- Consumes: `Task`, `TaskDraft`, `TaskFilters`, `TaskEnergy`, `TaskPriority`, `TaskStatus`, `taskStatuses`, and callbacks from `TaskWorkspace`.
- Produces: focused UI components that preserve existing class names, ARIA labels, and visible text so current tests remain valid.

- [ ] **Step 1: Move shared UI labels and formatting helpers**

Create `src/features/tasks/taskUiText.ts`:

```ts
import { formatDate } from '../../lib/date';
import type { TaskEnergy, TaskPriority, TaskStatus } from './taskTypes';

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

export function formatEstimate(minutes: number): string {
  return minutes > 0 ? `${minutes} 分钟` : '未估时';
}

export { formatDate };
```

Then remove the duplicated `statusLabels`, `priorityLabels`, `energyLabels`, and `formatEstimate` definitions from `TaskWorkspace.tsx` and import them from `taskUiText.ts`.

- [ ] **Step 2: Run tests after the text-helper extraction**

Run:

```bash
npm test -- --run src/features/tasks/TaskWorkspace.test.tsx
```

Expected result: PASS. If any labels fail, restore the exact Chinese copy expected by the tests.

- [ ] **Step 3: Create the bulk action component**

Create `src/features/tasks/TaskBulkActions.tsx`:

```tsx
import type { TaskStatus } from './taskTypes';
import { taskStatuses } from './taskDomain';
import { statusLabels } from './taskUiText';

interface TaskBulkActionsProps {
  selectedCount: number;
  onComplete: () => void;
  onMove: (status: TaskStatus) => void;
  onDelete: () => void;
  onClear: () => void;
}

export function TaskBulkActions({ selectedCount, onComplete, onMove, onDelete, onClear }: TaskBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-actions" aria-label="批量操作">
      <span>已选择 {selectedCount} 个任务</span>
      <button className="secondary-action" type="button" onClick={onComplete}>批量完成</button>
      <select aria-label="批量移动状态" defaultValue="" onChange={(event) => {
        if (!event.target.value) return;
        onMove(event.target.value as TaskStatus);
        event.target.value = '';
      }}>
        <option value="" disabled>移动到</option>
        {taskStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
      </select>
      <button className="danger-action" type="button" onClick={onDelete}>批量删除</button>
      <button className="clear-filter" type="button" onClick={onClear}>取消选择</button>
    </div>
  );
}
```

Replace the inline bulk action JSX in `TaskWorkspace.tsx` with:

```tsx
        <TaskBulkActions
          selectedCount={selectedTaskIds.length}
          onComplete={completeSelectedTasks}
          onMove={moveSelectedTasks}
          onDelete={deleteSelectedTasks}
          onClear={clearSelection}
        />
```

- [ ] **Step 4: Run tests after extracting bulk actions**

Run:

```bash
npm test -- --run src/features/tasks/TaskWorkspace.test.tsx -t "bulk|selected|delete selected|move selected"
```

Expected result: matching bulk-selection tests PASS.

- [ ] **Step 5: Create the detail panel component**

Create `src/features/tasks/TaskDetailPanel.tsx`:

```tsx
import { PanelRightClose, Trash2 } from 'lucide-react';
import type { Task, TaskDraft, TaskEnergy, TaskPriority, TaskStatus } from './taskTypes';
import { taskStatuses } from './taskDomain';
import { energyLabels, priorityLabels, statusLabels } from './taskUiText';

interface TaskDetailPanelProps {
  selectedTask: Task | undefined;
  labelsToInput: (labels: string[]) => string;
  labelsFromInput: (value: string) => string[];
  onPatchTask: (task: Task, patch: Partial<TaskDraft>) => void;
  onRemoveTask: (task: Task) => void;
  onClose: () => void;
}

export function TaskDetailPanel({ selectedTask, labelsToInput, labelsFromInput, onPatchTask, onRemoveTask, onClose }: TaskDetailPanelProps) {
  return (
    <aside className="detail" aria-label="任务详情">
      {selectedTask ? (
        <>
          <div className="detail-header">
            <span>任务详情</span>
            <div className="detail-actions">
              <button className="icon-button" type="button" onClick={onClose} aria-label="关闭详情面板">
                <PanelRightClose size={16} />
              </button>
              <button className="danger" type="button" onClick={() => onRemoveTask(selectedTask)} aria-label={`删除任务：${selectedTask.title}`}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <input aria-label="详情标题" value={selectedTask.title} onChange={(event) => onPatchTask(selectedTask, { title: event.target.value })} />
          <textarea aria-label="详情备注" value={selectedTask.notes} onChange={(event) => onPatchTask(selectedTask, { notes: event.target.value })} />
          <label>状态
            <select value={selectedTask.status} onChange={(event) => onPatchTask(selectedTask, { status: event.target.value as TaskStatus })}>
              {taskStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
          </label>
          <label>优先级
            <select value={selectedTask.priority} onChange={(event) => onPatchTask(selectedTask, { priority: event.target.value as TaskPriority })}>
              {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>截止日期
            <input type="date" value={selectedTask.dueDate} onChange={(event) => onPatchTask(selectedTask, { dueDate: event.target.value })} />
          </label>
          <label>预计用时（分钟）
            <input type="number" min="0" step="5" value={selectedTask.estimateMinutes || ''} onChange={(event) => onPatchTask(selectedTask, { estimateMinutes: Number(event.target.value) || 0 })} />
          </label>
          <label>精力类型
            <select value={selectedTask.energy} onChange={(event) => onPatchTask(selectedTask, { energy: event.target.value as TaskEnergy })}>
              {Object.entries(energyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>项目
            <input value={selectedTask.project} onChange={(event) => onPatchTask(selectedTask, { project: event.target.value })} />
          </label>
          <label>标签
            <input value={labelsToInput(selectedTask.labels)} onChange={(event) => onPatchTask(selectedTask, { labels: labelsFromInput(event.target.value) })} />
          </label>
        </>
      ) : (
        <div className="empty-state">还没有匹配的任务。</div>
      )}
    </aside>
  );
}
```

Replace the inline detail panel JSX in `TaskWorkspace.tsx` with `TaskDetailPanel` using the same callbacks.

- [ ] **Step 6: Run detail panel tests**

Run:

```bash
npm test -- --run src/features/tasks/TaskWorkspace.test.tsx -t "detail|labels toolbar"
```

Expected result: detail-collapse and accessibility tests PASS.

- [ ] **Step 7: Extract quick add, toolbar, and task views incrementally**

Move one section at a time from `TaskWorkspace.tsx` into these files:

```text
src/features/tasks/TaskQuickAdd.tsx
src/features/tasks/TaskToolbar.tsx
src/features/tasks/TaskViews.tsx
```

For each extracted component:

- Preserve existing class names.
- Preserve existing `aria-label` values.
- Preserve existing button names and visible Chinese text.
- Pass callbacks from `TaskWorkspace` instead of importing workspace state.
- Keep drag handlers owned by `TaskWorkspace` and pass them into `TaskViews` as props.

The target `TaskWorkspace.tsx` render shape should read like this:

```tsx
  return (
    <main className="workspace">
      <aside className="rail" aria-label="任务概览">
        <div className="brand-block">...</div>
        <section className="metric-grid" aria-label="任务统计">...</section>
        <TaskQuickAdd ... />
      </aside>

      <section className="main-panel" aria-label="任务列表">
        <TaskToolbar ... />
        <TaskBulkActions ... />
        <div className={`content-grid ${showDetail ? '' : 'detail-collapsed'}`}>
          <TaskViews ... />
          {showDetail && <TaskDetailPanel ... />}
        </div>
      </section>
    </main>
  );
```

- [ ] **Step 8: Run the full UI test file after each extraction**

Run after each component extraction:

```bash
npm test -- --run src/features/tasks/TaskWorkspace.test.tsx
```

Expected result after each extraction: all tests in `TaskWorkspace.test.tsx` PASS.

- [ ] **Step 9: Run all tests and build after the full split**

Run:

```bash
npm test
npm run build
```

Expected result: all tests PASS and production build succeeds.

- [ ] **Step 10: Commit**

Run:

```bash
git add src/features/tasks/TaskWorkspace.tsx src/features/tasks/taskUiText.ts src/features/tasks/TaskQuickAdd.tsx src/features/tasks/TaskToolbar.tsx src/features/tasks/TaskBulkActions.tsx src/features/tasks/TaskViews.tsx src/features/tasks/TaskDetailPanel.tsx
git commit -m "refactor: split task workspace ui"
```

---

### Task 3: Documentation And Final Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/optimization-roadmap.md`
- Test: all tests and build scripts

**Interfaces:**
- Consumes: final behavior after Tasks 1 and 2.
- Produces: documentation matching the current release-polished app and a verified build.

- [ ] **Step 1: Update README current boundary notes**

In `README.md`, keep the existing sections but update the current boundary paragraph to include the release polish result:

```md
## 当前边界

当前版本不包含账号、云同步、多人协作和外部集成。看板已支持跨列拖放推进状态和同列手动排序；旧任务数据会自动补齐排序、预计用时和精力字段。任务工作区已经拆分为更清晰的 UI 组件，但任务状态仍保留在主工作区中，便于本地优先的小型应用继续保持简单。

导入不会立刻覆盖当前任务。选择“替换当前任务”会用导入文件覆盖现有数据；选择“合并到当前任务”会只加入新 id 的任务。替换、删除和批量操作会清理无效选择，避免界面留下过期的批量状态。
```

- [ ] **Step 2: Update the optimization roadmap**

Append this section to `docs/optimization-roadmap.md`:

```md
### 第十批：发布级稳定优化

- 清理导入替换、删除和批量操作后的过期选择状态。
- 将任务工作区拆分为快速新增、工具栏、批量操作、任务视图和详情面板等更小的 UI 单元。
- 保持领域逻辑和备份逻辑集中在既有模块，避免 UI 组件重复实现任务规则。
- 用现有 Vitest UI 测试守住创建、筛选、导入、拖拽、批量操作和详情面板行为。

第十批已经落地：任务工作区仍负责状态编排，但渲染层被拆成更清晰的组件；替换导入和任务删除后的选择状态会自动清理，并通过测试和构建验证。
```

- [ ] **Step 3: Run the complete verification suite**

Run:

```bash
npm test
npm run build
```

Expected result: `npm test` reports all test files passing, and `npm run build` completes with a Vite production build.

- [ ] **Step 4: Inspect git diff for accidental unrelated edits**

Run:

```bash
git diff -- README.md docs/optimization-roadmap.md src/features/tasks
```

Expected result: diff only includes the intended selection cleanup, UI split, and documentation updates.

- [ ] **Step 5: Commit documentation and verification updates**

Run:

```bash
git add README.md docs/optimization-roadmap.md
git commit -m "docs: record release polish phase"
```

- [ ] **Step 6: Final status check**

Run:

```bash
git status --short
```

Expected result: no modified tracked files from this release-polish work. Untracked project files may still appear if they predated this plan and were intentionally not staged.

---

## Self-Review

Spec coverage:

- Existing behavior preservation is covered by running the focused UI tests after each extraction plus the final full test/build commands.
- Component boundary improvements are covered by Task 2.
- User-visible polish around stale selection and consistent state is covered by Task 1.
- Documentation updates are covered by Task 3.
- Out-of-scope constraints are reflected in Global Constraints and no task adds dependencies or major features.

Placeholder scan:

- The plan does not use TBD, TODO, placeholder text, or undefined future tasks.
- The only incremental instruction is Task 2 Step 7, which is bounded by exact target files, preservation rules, and verification after each extraction.

Type consistency:

- Component props use existing `Task`, `TaskDraft`, `TaskFilters`, `TaskEnergy`, `TaskPriority`, and `TaskStatus` types from `taskTypes.ts`.
- UI labels use `statusLabels`, `priorityLabels`, `energyLabels`, `formatDate`, and `formatEstimate` from the new `taskUiText.ts` file.
- Bulk move callbacks accept `TaskStatus`, matching the existing `moveSelectedTasks(status: TaskStatus)` callback.
