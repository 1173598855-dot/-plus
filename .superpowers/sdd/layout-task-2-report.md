# Layout Task 2 Report

## Scope

Implemented progressive quick capture in `TaskWorkspace` and `TaskQuickAdd`.
The title input and Add button remain mounted while notes and metadata are conditionally disclosed. The `n` shortcut expands the section and focuses the title input on the next animation frame.

## RED

Command:

```powershell
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "progressively discloses|expands quick add"
```

Result: failed as expected, `1 failed | 1 passed | 35 skipped` (37 total).

Failure reason: the initial render still contained the `任务备注` textarea, so the new test's assertion that details are initially hidden failed. This proved progressive disclosure was not yet implemented.

## GREEN and Verification

Commands:

```powershell
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "progressively discloses|expands quick add"
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "quick add|shortcut|creates a task"
npm test -- src/features/tasks/TaskWorkspace.test.tsx
npm run build
```

Results:

- New disclosure/shortcut tests: `2 passed | 35 skipped` (37 total).
- Focused quick-add/shortcut/create tests: `4 passed | 33 skipped` (37 total).
- Complete `TaskWorkspace` suite: `37 passed`.
- Production build: passed (`tsc --noEmit && vite build`).

## Files

- `src/features/tasks/TaskWorkspace.tsx`
- `src/features/tasks/TaskQuickAdd.tsx`
- `src/features/tasks/taskUiText.ts`
- `src/features/tasks/TaskWorkspace.test.tsx`

## Self-Review

- `TaskWorkspace` owns `isQuickAddExpanded` and passes controlled props to `TaskQuickAdd`.
- Disclosure uses exact accessible labels and Lucide Chevron icons.
- Title input and primary Add button remain mounted in both states.
- Existing tests that require hidden metadata explicitly expand it before interaction.
- Task creation resets only draft values and labels, preserving the expansion state.
- No domain, backup, storage, drag-and-drop, or bulk-action code changed.
- `git diff --check` completed without whitespace errors.

## Concern

None.

## Disclosure Semantics Follow-up

Review found that the progressive disclosure control lacked standard state semantics. The toggle now exposes `aria-expanded`, references the stable `quick-add-fields` region through `aria-controls`, and the conditional detail container uses that id when expanded. No CSS was added; Task 5 owns styling for `.quick-capture-row` and `.quick-add-fields`.

### RED

```powershell
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "progressively discloses"
```

Result: failed as expected, `1 failed | 36 skipped` (37 total). The disclosure button had no `aria-expanded` attribute.

### GREEN and Verification

```powershell
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "progressively discloses"
npm test -- src/features/tasks/TaskWorkspace.test.tsx
npm run build
```

Results:

- Disclosure semantics test: `1 passed | 36 skipped` (37 total).
- Complete `TaskWorkspace` suite: `37 passed`.
- Production build: passed (`tsc --noEmit && vite build`).
