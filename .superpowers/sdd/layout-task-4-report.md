# Layout Task 4 Report

## Scope

Moved task details out of the task canvas into a conditional overlay layer. The workspace now owns the default-closed drawer state and preserves `selectedId` across close and reopen. Direct board and list task activation opens the drawer; checkbox and completion-button propagation behavior remains unchanged.

## RED

Command:

```powershell
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "detail drawer|selected task"
```

Result: failed as expected. The new drawer test found `任务详情` in the initial render because `showDetail` was still `true`; the implementation also had no `任务详情层`.

## GREEN And Verification

Commands:

```powershell
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "detail|drawer|selected task"
npm test -- src/features/tasks/TaskWorkspace.test.tsx
npm run build
```

Results:

- Focused detail/drawer coverage: 13 passed, 27 skipped.
- Full `TaskWorkspace` suite: 40 passed.
- Production build: passed (`tsc --noEmit && vite build`).

During final verification, the existing combined keyboard-shortcut test exposed a timing-dependent assertion: the `n` handler focuses on `requestAnimationFrame`, but the test asserted synchronously. It now uses the same `waitFor` condition as the dedicated shortcut-focus test; the focused keyboard test passes.

## Files

- `src/features/tasks/TaskWorkspace.tsx`
- `src/features/tasks/TaskViews.tsx`
- `src/features/tasks/TaskWorkspace.test.tsx`
- `.superpowers/sdd/layout-task-4-report.md`

## Self-Review

- `showDetail` defaults to `false`; closing only changes drawer visibility and does not clear `selectedId`.
- `.content-grid` contains only `TaskViews`, while `.detail-layer`, its aria-hidden scrim, and `TaskDetailPanel` are sibling overlay content.
- Board cards and list rows use `onOpenDetail(task)`; checkbox and completion button handlers still stop propagation.
- No task-domain, storage, backup, import/export, bulk-action, or Task 5 CSS changes were made.

## Concern

The overlay layer has no new styling in this task by design; positioning and visual drawer treatment are reserved for Task 5 CSS.
