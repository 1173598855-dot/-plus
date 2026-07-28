# Task 1 Report: Selection And Import Edge Cases

## Status

DONE

## Exact Edits

- `src/features/tasks/TaskWorkspace.tsx`
  - `replaceTasksWithImport` now clears `selectedTaskIds` when it replaces the task list.
  - Added a `tasks`-scoped effect that removes selected ids absent from the actual task list and changes a missing detail selection to the first task id or an empty string. Both setters return the current state when no change is needed.
- `src/features/tasks/TaskWorkspace.test.tsx`
  - Retained the required `clears bulk selection when imported tasks replace the current task list` UI regression.
  - Added `does not restore bulk selection when a replaced task id is merged later`, which makes stale internal selection observable by merging the old id back after replacement.

## RED Evidence

The plan-specified UI regression was already present in the starting test file. It passed both initially and with the pre-existing visible-task cleanup effect removed because the bulk bar derives its count from visible selected tasks; a stale id is hidden after replacement.

The added observable regression was run with this task's production changes temporarily removed:

```text
npm test -- --run src/features/tasks/TaskWorkspace.test.tsx -t "does not restore bulk selection when a replaced task id is merged later"
FAIL src/features/tasks/TaskWorkspace.test.tsx:568
expected document not to contain element, found <span>已选择 1 个任务</span>
```

This proves that a selected old id remained in state and reappeared as a bulk selection when that id was merged back.

## GREEN Evidence

```text
npm test -- --run src/features/tasks/TaskWorkspace.test.tsx -t "bulk selection"
PASS: 2 passed, 30 skipped

npm test -- --run src/features/tasks/TaskWorkspace.test.tsx
PASS: 32 passed
```

## Self-Review Notes

- Reviewed only `TaskWorkspace.tsx` and `TaskWorkspace.test.tsx`.
- Import, merge, message text, filter, detail, drag, and existing bulk behavior remain covered by the complete focused test file.
- No dependencies were added and no unrelated UI was refactored.
