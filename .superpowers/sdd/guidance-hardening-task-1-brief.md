# Task 1 Brief: Task Decoder And Recoverable Storage

Plan source: `docs/superpowers/plans/2026-07-28-guidance-audit-hardening.md`, Task 1.

## Goal

Prevent malformed/hostile backup or localStorage data from crashing the task manager or being silently overwritten. Reuse one strict, legacy-compatible decoder and give invalid stored raw data a recoverable UI path.

## Global Constraints

- Keep storage key `personal-task-manager.tasks.v1` and object backup version `1`.
- Preserve raw task-array imports and legacy tasks missing `sortOrder`, `estimateMinutes`, and `energy`.
- No dependencies or task-model changes.
- `TaskWorkspace` remains the only task-array owner.
- Invalid stored JSON/schema must not be overwritten until explicit reset or confirmed import.
- User-facing recovery copy belongs in `taskUiText.ts`; decoder errors may stay in `taskBackup.ts`.
- Decoder limits: at most 10,000 tasks; id 200 chars; title 500; notes 20,000; project 200; at most 50 labels of 100 chars each. Unknown fields must not persist.
- Dates must be empty or real `YYYY-MM-DD`; created/updated timestamps must parse as ISO timestamps; completed tasks require a valid completed timestamp and active tasks require an empty completed timestamp.
- Follow strict TDD: add one focused failing behavior, run and record RED, implement minimally, run GREEN, repeat.

## Required Files

- `src/features/tasks/taskBackup.test.ts`
- `src/features/tasks/taskBackup.ts`
- `src/lib/storage.test.ts`
- `src/lib/storage.ts`
- `src/features/tasks/TaskWorkspace.test.tsx`
- `src/features/tasks/TaskWorkspace.tsx`
- `src/features/tasks/TaskQuickAdd.tsx`
- `src/features/tasks/taskUiText.ts`
- `docs/superpowers/plans/2026-07-28-guidance-audit-hardening.md` (include existing plan in Task 1 commit)

## Required Interfaces And Behavior

1. Export `decodeTaskArray(value: unknown): Task[] | undefined` from `taskBackup.ts`. A valid empty array returns `[]`; invalid data returns `undefined`. It constructs whitelisted `Task` objects, rejects duplicate/non-empty-invalid ids and titles, invalid dates/timestamps/completion consistency, excessive counts/lengths, and normalizes optional legacy fields.
2. `importTasksFromJson` accepts a raw array or object `{ version: 1, exportedAt, tasks }`. Object versions other than 1 throw `不支持的任务备份版本。`; invalid task data keeps the current generic Chinese decoder error.
3. Add `readJson<T>` to `storage.ts` returning a discriminated result for `missing`, `success`, `invalid` (with raw), and `unavailable`. Access to `window.localStorage` must happen inside the try path. Keep `loadJson`/`saveJson` compatibility and current injected `StorageLike` tests.
4. `TaskWorkspace` lazy startup reads `unknown`, decodes before normalize/use, and falls back to seed tasks without crashing. Invalid raw data is held in recovery state and persistence is skipped so the original localStorage string remains byte-for-byte unchanged.
5. Recovery UI offers accessible commands named exactly `下载损坏的原始数据`, `重试本地存储`, and `使用当前任务重置本地存储`. Download exports the original raw string. Retry adopts valid stored tasks or keeps recovery. Reset is an explicit action that allows current tasks to replace the damaged snapshot.
6. A confirmed valid import replacement or merge resolves recovery and resumes persistence. Do not implement the nullable empty-import preview yet; that is Task 4.

## Required Tests

- Decoder rejects whitespace title, empty id, impossible date, invalid timestamps, completion mismatch, duplicate ids, future object version, excessive fields/counts, and unknown fields. Preserve valid v1, raw array, legacy optional-field tests, and valid empty arrays.
- `readJson` distinguishes missing/success/invalid/unavailable and captures raw invalid JSON. Cover a throwing storage getter.
- Workspace renders seed tasks and recovery controls for malformed JSON and valid-wrong-shape JSON, does not overwrite the raw value after effects, downloads raw text, retries, resets explicitly, and does not mount-crash when storage getter throws.

## Verification

Run and record:

```powershell
npm test -- src/features/tasks/taskBackup.test.ts
npm test -- src/lib/storage.test.ts
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "storage|stored|recovery|damaged"
npx tsc --noEmit
git diff --check
```

Run broader covering tests if focused selectors do not include every added workspace case.

## Report Contract

Write `.superpowers/sdd/guidance-hardening-task-1-report.md` with:

- Status: `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, or `BLOCKED`.
- Every RED command and the expected failure observed.
- Every GREEN command and pass count.
- Files changed and concise design notes.
- Self-review findings and remaining concerns.
- Commit hash(es).

Commit only Task 1 scoped files with message `fix: harden task storage recovery`.
