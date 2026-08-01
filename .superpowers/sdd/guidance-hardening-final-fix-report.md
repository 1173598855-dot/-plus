# Guidance Hardening Final Fix Report

Implementation final commit: `ee2d4b0d13515e31935a5d08aeca44344208324b fix: complete guidance hardening review`

## RED / GREEN Evidence

- RED: `npm test -- src/features/tasks/taskDomain.test.ts` -> 11 passed, 2 failed. The new schema round-trip test received `undefined`; the `Number.MAX_VALUE` append order stayed equal to `Number.MAX_VALUE`.
- GREEN: `npm test -- src/features/tasks/taskDomain.test.ts` -> 13 passed, 0 failed.
- RED: `npm test -- src/lib/date.test.ts` -> 2 passed, 1 failed. Expected caller fallback `No date`, received the hard-coded empty-date label.
- GREEN: `npm test -- src/lib/date.test.ts` -> 2 passed, 0 failed.
- Focused workspace GREEN: `npm test -- src/features/tasks/TaskWorkspace.test.tsx` -> 73 passed, 0 failed. Before the final implementation, the existing extreme-order regression failed: expected appended title `列尾新任务`, received `已导入高位任务`.

## Final Verification

- `npm test` -> 6 files passed, 134 tests passed.
- `npm run build` -> passed (`tsc --noEmit` and Vite build).
- `git diff --check` -> passed with no whitespace errors.

## Files and Decisions

- Added `taskSchema.ts` as the shared decoder/domain limit source, including date and timestamp validators.
- Normalized bounded title, id, notes, project, labels, and dates in domain writes so created/updated tasks decode on the next mount.
- Added explicit storage blocking independent of raw recovery text; failed retries preserve current tasks and known raw data, while successful valid/missing retries unblock correctly.
- Blocked merge confirmation when unique final task count exceeds 10,000 without clearing pending import or recovery state.
- Renumbered an extreme target column before appending to give the new task a finite, deterministic final order.
- Made `formatDate` generic and moved the UI fallback to `taskUiText` usage through `dueFilterLabels.none`.

## Final Review Addendum

- Added the `ARCHITECTURE.md` correction: domain functions do not read current time or external state; `createTask` parses its injected timestamp for fallback sort order.
- Added the explicit UI regression for retaining a known invalid raw string after an unavailable retry.
  - It initially passed on the existing repair. To prove sensitivity, the retention assignment was temporarily changed to `setRecoveryRaw(next.recoveryRaw)`.
  - RED: `npm test -- src/features/tasks/TaskWorkspace.test.tsx` -> 74 passed, 1 failed; the damaged-data download control disappeared as expected.
  - GREEN: restored the retention assignment; focused run -> 75 passed, 0 failed.
- Added the explicit merge rejection regression. It exercises the same shared limit branch with a temporary limit of 1 to avoid rendering 10,000 cards in JSDOM; production remains fixed at 10,000.
  - It initially passed on the existing repair. To prove sensitivity, the `tasks.length + tasksToAdd.length > taskSchemaLimits.maxTasks` guard was temporarily removed.
  - RED: `npm test -- src/features/tasks/TaskWorkspace.test.tsx` -> 74 passed, 1 failed; `overflow import` was rendered, proving partial mutation.
  - GREEN: restored the guard; focused run -> 75 passed, 0 failed.
- Final: `npm test` -> 6 files passed, 134 tests passed; `npm run build` and `git diff --check` passed.

## Self Review

- Reviewed the committed diff against the brief and preserved `TaskWorkspace` as the sole task-array owner.
- Decoder error constants are exported and covered by a stability test; existing parser messages remain unchanged for compatibility.
- No remaining concerns.
