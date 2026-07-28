# Task 1 Report: Task Decoder And Recoverable Storage

Status: DONE

## RED Evidence

- `npm test -- src/features/tasks/taskBackup.test.ts`
  - Expected: the new decoder API should be absent before implementation.
  - Observed: 2 failures, `TypeError: decodeTaskArray is not a function`.
- `npm test -- src/features/tasks/taskBackup.test.ts`
  - Expected: legacy optional fields must remain compatible after the first decoder implementation.
  - Observed: 1 failure; legacy `sortOrder` was normalized to `0` instead of `1000`.
- `npm test -- src/lib/storage.test.ts`
  - Expected: the result API should be absent before implementation.
  - Observed: 1 failure, `TypeError: readJson is not a function`.
- `npm test -- src/lib/storage.test.ts src/features/tasks/TaskWorkspace.test.tsx -t "storage|stored|recovery|damaged"`
  - Expected: recovery controls and write protection should be absent before implementation.
  - Observed: 5 failures; recovery controls were missing and invalid local data was replaced by seed tasks.
- `npm test -- src/features/tasks/taskBackup.test.ts -t "impossible timezone offsets"`
  - Expected: an offset beyond the real ISO range must be rejected.
  - Observed: 1 failure; `+14:01` was accepted because `Date.parse` permits offsets beyond `+14:00`.

## GREEN Evidence

- `npm test -- src/features/tasks/taskBackup.test.ts`: 8 passed after the initial decoder cycle; final run: 19 passed.
- Follow-up decoder review run: 22 passed after rejecting impossible calendar timestamps and timezone offsets while preserving explicit valid offsets.
- `npm test -- src/lib/storage.test.ts`: 5 passed after the initial storage cycle; final run: 7 passed.
- `npm test -- src/lib/storage.test.ts src/features/tasks/TaskWorkspace.test.tsx -t "storage|stored|recovery|damaged"`: 13 passed.
- `npm test -- src/features/tasks/taskBackup.test.ts src/lib/storage.test.ts src/features/tasks/TaskWorkspace.test.tsx`: 88 passed.
- Final required focused run, `npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "storage|stored|recovery|damaged"`: 8 passed, 54 skipped.
- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.

## Files Changed And Design Notes

- `src/features/tasks/taskBackup.ts` and test: add a strict, whitelisting `decodeTaskArray` with size, field, date, timestamp, completion, duplicate-id, unknown-field, and legacy-option validation. Backup imports share this decoder and reject unsupported versions.
- `src/lib/storage.ts` and test: add a discriminated `readJson` result that preserves raw invalid JSON and protects browser-storage access with `try` handling. Existing load/save APIs remain compatible.
- `src/features/tasks/TaskWorkspace.tsx`, `TaskQuickAdd.tsx`, `taskUiText.ts`, and test: decode local data before use; retain invalid raw snapshots, skip writes while recovery is unresolved, and provide download, retry, explicit reset, and import-resolution actions.
- `docs/superpowers/plans/2026-07-28-guidance-audit-hardening.md`: included as required by Task 1.

## Self-Review And Concerns

- Decoder output is explicitly reconstructed, so unknown persisted task fields cannot round-trip.
- Calendar components and real timezone-offset bounds are checked before `Date.parse`, preventing its rollover and overly permissive offset behavior.
- Valid empty arrays remain valid decoder/import values. The existing Task 4 nullable empty-import preview behavior is intentionally not introduced here.
- A Vitest parallel rerun briefly resolved the repository through an isolated cwd and could not locate source files. Sequential and `npm --prefix` reruns completed successfully; this is a test-runner environment artifact, not a product failure.

## Commit

- `a908293` (implementation commit).
- `04bed9a` (timestamp validation review fix).
