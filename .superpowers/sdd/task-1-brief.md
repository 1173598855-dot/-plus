# Task 1 Brief: Selection And Import Edge Cases

## Goal

Make stale detail and bulk selections disappear when the actual task list is replaced or destructively changed.

## Files

- Modify `src/features/tasks/TaskWorkspace.test.tsx`
- Modify `src/features/tasks/TaskWorkspace.tsx`

## Required work

1. Add a UI regression test named `clears bulk selection when imported tasks replace the current task list` near the import tests. It must select the seeded task `整理本周重点任务`, upload a valid version-1 JSON backup containing only task id `import-clean-selection` with title `替换后的干净任务`, confirm `替换当前任务`, then assert the selected-count bar is gone and the imported title is visible.
2. Run the focused test and record the expected RED failure caused by the stale selected count.
3. In `replaceTasksWithImport`, clear bulk selection with `setSelectedTaskIds([])` while preserving existing Chinese message text.
4. Add an effect that prunes bulk selected ids against the actual `tasks` ids and resets `selectedId` to the first task (or empty string) when the selected detail id no longer exists. Avoid redundant state updates where practical.
5. Run the focused test, then the full `TaskWorkspace.test.tsx` file. Both must pass.
6. Self-review only the two scoped files. Do not add dependencies or refactor unrelated UI.

## Plan correction

The original plan expected the named immediate post-replacement UI test to fail before implementation. Baseline execution proved that expectation false: the bulk bar is derived from visible selected ids, so it hides an internally stale id. Preserve that named test for the immediate user-visible outcome, and use the additional replace-then-merge-same-id regression as the required RED/GREEN evidence for the stale-state defect. This observable behavioral test satisfies the intent; do not expose internal React state or weaken existing visible-selection derivation merely to force the original test to fail.

## Constraints

- Use TDD: test first, observe the correct failure, then implement.
- Keep `TaskWorkspace` as state owner.
- Preserve all existing create/edit/filter/import/drag/bulk/detail behavior and Chinese UI copy.
- Use `apply_patch` for edits.
- Do not commit. The controller will handle repository bookkeeping because most project files started untracked.

## Report

Write `.superpowers/sdd/task-1-report.md` containing: status (`DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, or `BLOCKED`), exact edits, RED evidence, GREEN commands/results, and self-review notes. Return only status plus one-line test summary and concerns.
