# Task 1: Board Column Creation Behavior

Plan: `docs/superpowers/plans/2026-07-28-board-inline-quick-add.md`
Spec: `docs/superpowers/specs/2026-07-28-board-inline-quick-add-design.md`

## Scope

Implement and test only board-column creation behavior. Do not edit CSS or documentation in this task. Preserve all existing task-domain, storage, backup, drag/reorder, bulk-action, and detail-drawer behavior.

## Files

- Modify `src/features/tasks/TaskWorkspace.test.tsx`
- Modify `src/features/tasks/taskUiText.ts`
- Modify `src/features/tasks/TaskViews.tsx`
- Modify `src/features/tasks/TaskWorkspace.tsx`
- Write report `.superpowers/sdd/board-inline-task-1-report.md`

## Required Interface

`TaskViewsProps` produces `onAddTaskToColumn(title: string, status: TaskStatus): void`. `TaskWorkspace` consumes it and calls the existing `createTask` with `{ title, status }` plus the existing clock helpers.

Add this centralized copy API:

```ts
export const columnQuickAddLabels = {
  form: (status: string) => `在${status}中新建任务`,
  title: (status: string) => `${status}任务标题`,
  submit: (status: string) => `添加到${status}`,
  placeholder: '添加任务',
  created: (status: string, title: string) => `已在${status}创建任务“${title}”。`,
} as const;
```

## Required Behavior

1. Each board status column renders one native `<form>` only when `hasActiveFilters` is false.
2. The form, input, and Plus submit button use the exact accessible names produced by `columnQuickAddLabels`.
3. Draft state is `Partial<Record<TaskStatus, string>>`; each column draft is independent.
4. Pressing normal Enter or clicking Plus trims and submits a non-empty title.
5. Enter while `event.nativeEvent.isComposing` does not submit.
6. The submit button is disabled for an empty or whitespace-only title.
7. Success clears only that column's draft and leaves focus on that input.
8. `TaskWorkspace` creates through `createTask`, prepends to task state, selects the new task, does not open details, and emits `已在<状态>创建任务“<标题>”。` without manual HTML encoding.
9. The task persists through the existing localStorage effect. Creating in `done` results in a non-empty `completedAt` through the domain function.
10. Any active filter/search/hide-completed state hides all column forms; clearing filters restores them.
11. Existing workspace behavior and all prior tests remain green.

## TDD Evidence Required

Add focused tests for:

- trimmed Enter creation in `next`, focus retention, message, and persistence;
- Plus button creation and independent drafts;
- completed-column creation with `completedAt` in stored JSON;
- whitespace disabled/no creation and composition Enter no creation;
- filter hiding and clear-filter restoration.

Run focused tests before implementation and record the expected RED reasons. Then implement the minimum behavior and run:

```powershell
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "board column|column drafts|composition|filtered board"
npm test -- src/features/tasks/TaskWorkspace.test.tsx
```

## Report Contract

Write `.superpowers/sdd/board-inline-task-1-report.md` with changed files, exact RED/GREEN commands and counts, self-review, and concerns. Return only status, commit hash, one-line test summary, and concerns. Commit only Task 1 source/tests/report files with message `feat: add board column quick capture behavior`.
