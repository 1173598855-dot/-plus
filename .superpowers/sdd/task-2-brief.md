# Task 2 Brief: Split Presentational Task UI Components

## Goal

Keep `TaskWorkspace` as the single state/orchestration owner while extracting its presentational render sections into focused sibling components without changing behavior, copy, accessibility names, class names, or layout.

## Files

- Modify `src/features/tasks/TaskWorkspace.tsx`
- Modify and retain `src/features/tasks/taskUiText.ts`
- Create `TaskQuickAdd.tsx`, `TaskToolbar.tsx`, `TaskBulkActions.tsx`, `TaskViews.tsx`, `TaskDetailPanel.tsx` in `src/features/tasks/`
- Use existing `TaskWorkspace.test.tsx` as characterization coverage; only modify it if a genuine uncovered regression requires it.

## Existing-state note

`taskUiText.ts` already centralizes the label maps plus extended quick-add/toolbar/bulk/detail/empty-state copy. Preserve those exact current strings, including `formatEstimate` returning `无预计`; add explicit `Record<...>` typing and re-export `formatDate` only if useful, but do not replace tested current copy with stale example copy from the plan. `TaskWorkspace.test.tsx` has 32 passing tests after Task 1.

## Required extraction order and gates

1. Normalize shared label/helper imports only as needed; run the full workspace test file.
2. Extract `TaskBulkActions`: receives visible selected count and complete/move/delete/clear callbacks. Preserve the current conditional visibility, classes, labels, select reset behavior, and status options. Run matching bulk tests.
3. Extract `TaskDetailPanel`: receives selected task, context-specific empty message, patch/remove/close callbacks. Preserve exact current delete aria label (`删除：<title>`), all fields, classes, and labels. Run matching detail tests.
4. Extract `TaskQuickAdd`: render brand, metrics, task capture form, backup controls, live status message, and pending-import confirmation. Refs for keyboard focus must continue to work (use `forwardRef` or an explicit input-ref prop). All state mutations stay as callbacks/props from `TaskWorkspace`. Run the full workspace test file.
5. Extract `TaskToolbar`: render view switch, search, status/chips, detail toggle, and all filters/hide-completed controls. Search ref and keyboard shortcuts must continue to work. Run the full workspace test file.
6. Extract `TaskViews`: render board/list/today/completed views, task cards/rows, empty states, selection, complete/detail actions, and drag/drop wiring. Drag handlers and state remain owned by `TaskWorkspace` and are passed as props/callbacks. Run the full workspace test file.
7. Run `npm test` and `npm run build`.

## Architecture constraints

- No new dependencies or unrelated CSS/domain/backup/storage refactors.
- No duplicated task business rules inside child components.
- Use explicit exported prop interfaces or clear local interfaces; callbacks should preserve type safety using existing `Task`, `TaskDraft`, `TaskFilters`, `TaskEnergy`, `TaskPriority`, `TaskStatus`, `TaskSummary`, and `TaskGroups` types.
- Preserve all current Chinese copy through `taskUiText.ts`, existing class names, DOM semantics, aria labels, and view behavior.
- `TaskWorkspace` retains every `useState`, derived selector, effect, task/import/export action, and drag orchestration callback.
- Remove icon/type imports from `TaskWorkspace` once their JSX moves; each child imports only what it renders.
- Use `apply_patch` for edits. Do not commit; the controller handles bookkeeping for this initially-untracked project.

## Verification/report

Record each incremental command and result. After the final build, self-review imports, prop boundaries, unused code, and accidental copy/class changes. Write `.superpowers/sdd/task-2-report.md` with status, files/structure, each gate result, final test/build output, and concerns. Return only status, one-line verification summary, and concerns.
