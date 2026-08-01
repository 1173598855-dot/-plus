# Guidance Audit Hardening Implementation Plan

> **Status:** Complete. Tasks 1-5 and the final hardening review landed in implementation commit `ee2d4b0`.
> A fresh 2026-08-02 verification passed: 6 Vitest files / 134 tests, production build, and `git diff --check`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the correctness, recovery, editing, date, import, and ordering gaps found by the repository-wide audit while preserving the validated task-manager workflows and visual system.

**Architecture:** Keep `TaskWorkspace` as the single task-state owner, keep domain rules pure and deterministic, and reuse one strict task decoder for backups and local snapshots. UI components may own ephemeral raw form text and recovery disclosure state, but persisted task data continues to flow through domain functions and the existing localStorage key.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, browser localStorage, plain CSS, lucide-react.

## Global Constraints

- Keep the storage key exactly `personal-task-manager.tasks.v1` and the supported object backup version exactly `1`.
- Preserve raw task-array import compatibility and legacy tasks that omit `sortOrder`, `estimateMinutes`, and `energy`.
- Do not add dependencies, accounts, cloud sync, collaboration, remote resources, a component library, or a state-management framework.
- Keep `TaskWorkspace` as the only owner of the task array; task text drafts and import/recovery state remain ephemeral UI state.
- Preserve all existing create, filter, view, bulk, drag, backup, keyboard, drawer, full-height, responsive, focus, and reduced-motion behavior.
- Keep user-facing Chinese copy in `taskUiText.ts`, except backup decoder error constants that remain with the decoder and are re-exported for tests.
- Validate imported files before state changes: at most 5 MiB, at most 10,000 tasks, unique non-empty ids, non-empty titles, real ISO dates/timestamps, bounded text/labels, and no unknown persisted fields.
- Invalid stored JSON or schema must not crash or overwrite the original raw value automatically; the UI must offer download, retry, and explicit reset/replacement paths.
- `npm test`, `npm run build`, `git diff --check`, and desktop/mobile browser acceptance must pass.

---

### Task 1: Task Decoder And Recoverable Storage

**Files:**
- Modify: `src/features/tasks/taskBackup.test.ts`
- Modify: `src/features/tasks/taskBackup.ts`
- Modify: `src/lib/storage.test.ts`
- Modify: `src/lib/storage.ts`
- Modify: `src/features/tasks/TaskWorkspace.test.tsx`
- Modify: `src/features/tasks/TaskWorkspace.tsx`
- Modify: `src/features/tasks/TaskQuickAdd.tsx`
- Modify: `src/features/tasks/taskUiText.ts`

**Interfaces:**
- Produces: `decodeTaskArray(value: unknown): Task[] | undefined` and `readJson<T>(key, storage?): JsonReadResult<T>`.
- Consumes: `normalizeTasks`, `seedTasks`, and `personal-task-manager.tasks.v1`.

- [x] **Step 1: Add decoder failure tests**

Add focused cases that reject a whitespace title, impossible date, invalid timestamp, duplicate ids, a future object version, excessive field lengths, and unknown fields while preserving legacy raw arrays:

```ts
it.each([
  [{ ...task, title: '   ' }],
  [{ ...task, dueDate: '2026-02-30' }],
  [{ ...task, createdAt: 'yesterday' }],
  [{ ...task }, { ...task }],
  [{ ...task, hiddenSecret: 'must-not-round-trip' }],
])('rejects unsafe task data %#', (tasks) => {
  expect(() => importTasksFromJson(JSON.stringify(tasks))).toThrow();
});

it('rejects unsupported object backup versions', () => {
  expect(() => importTasksFromJson(JSON.stringify({ version: 2, tasks: [task] }))).toThrow('不支持的任务备份版本。');
});
```

- [x] **Step 2: Run decoder tests RED**

Run: `npm test -- src/features/tasks/taskBackup.test.ts`

Expected: the new semantic validation cases fail because the current decoder only checks primitive types and ignores version/unknown fields.

- [x] **Step 3: Implement a whitelist decoder**

Create explicit validation helpers and construct a new object containing only the 13 base fields plus the three compatible optional fields before calling `normalizeTasks`. Reject duplicate ids at collection scope and use real calendar validation rather than regex alone.

- [x] **Step 4: Add storage result and startup recovery tests**

```ts
it('returns an invalid result with the original raw JSON', () => {
  const storage = createStorage('{broken');
  expect(readJson('tasks', storage)).toMatchObject({ status: 'invalid', raw: '{broken' });
});

it('mounts with recovery actions without overwriting a damaged snapshot', () => {
  localStorage.setItem('personal-task-manager.tasks.v1', JSON.stringify({ unexpected: true }));
  render(<TaskWorkspace />);
  expect(screen.getByRole('button', { name: '下载损坏的原始数据' })).toBeInTheDocument();
  expect(localStorage.getItem('personal-task-manager.tasks.v1')).toBe(JSON.stringify({ unexpected: true }));
});
```

Also cover a throwing `window.localStorage` getter and verify load falls back without a mount exception.

- [x] **Step 5: Run storage/startup tests RED**

Run: `npm test -- src/lib/storage.test.ts src/features/tasks/TaskWorkspace.test.tsx -t "storage|stored|recovery|damaged"`

Expected: the result API and recovery controls do not exist, and wrong-shape JSON currently crashes at `normalizeTasks().map`.

- [x] **Step 6: Implement recovery state**

Use a lazy initial read that distinguishes missing, valid, invalid, and unavailable storage. Keep invalid raw text in state, skip persistence while unresolved, and expose commands to download the raw value, retry the storage read, or explicitly reset using the currently displayed tasks. A confirmed import replacement or merge resolves recovery and resumes persistence.

- [x] **Step 7: Verify Task 1 GREEN**

Run:

```powershell
npm test -- src/features/tasks/taskBackup.test.ts src/lib/storage.test.ts
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "storage|stored|recovery|damaged"
```

Expected: all focused decoder and recovery tests pass with no uncaught console errors.

---

### Task 2: Natural Detail Editing And Copy Contracts

**Files:**
- Modify: `src/features/tasks/TaskWorkspace.test.tsx`
- Modify: `src/features/tasks/TaskDetailPanel.tsx`
- Modify: `src/features/tasks/TaskToolbar.tsx`
- Modify: `src/features/tasks/TaskViews.tsx`
- Modify: `src/features/tasks/TaskWorkspace.tsx`
- Modify: `src/features/tasks/taskUiText.ts`

**Interfaces:**
- Consumes: `onPatch(task, patch)`, `labelsFromInput`, and `labelsToInput`.
- Produces: raw text drafts keyed by the current task id; valid normalized task patches remain owned by `TaskWorkspace`.

- [x] **Step 1: Add real typing regression tests**

```tsx
it('supports natural multi-word and comma-separated typing in task details', async () => {
  const user = userEvent.setup();
  render(<TaskWorkspace />);
  await user.click(screen.getByRole('button', { name: '查看详情：任务管理库第一篇文档' }));

  const title = screen.getByLabelText('详情标题');
  await user.clear(title);
  await user.type(title, '新的 任务标题');
  expect(title).toHaveValue('新的 任务标题');

  const notes = screen.getByLabelText('详情备注');
  await user.clear(notes);
  await user.type(notes, '第一段 第二段');
  expect(notes).toHaveValue('第一段 第二段');

  const labels = screen.getByLabelText('标签');
  await user.clear(labels);
  await user.type(labels, '开发, 审查');
  expect(labels).toHaveValue('开发, 审查');
});
```

- [x] **Step 2: Run detail test RED**

Run: `npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "natural multi-word"`

Expected: clearing the title throws and typed spaces/commas disappear.

- [x] **Step 3: Implement raw detail drafts**

Keep raw `title`, `notes`, `project`, and label input state in `TaskDetailPanel`, reset it when `task.id` changes, and use those values to control the inputs. Send non-empty title patches and all other patches through the existing callback; normalize the visible draft on blur.

- [x] **Step 4: Add literal status-message regression test**

```tsx
it('announces task text literally without displaying HTML entities', async () => {
  const user = userEvent.setup();
  render(<TaskWorkspace />);
  await user.type(screen.getByLabelText('任务标题'), '<审查 & 修复>');
  await user.click(screen.getByRole('button', { name: '添加任务' }));
  expect(screen.getByRole('status')).toHaveTextContent('已创建任务“<审查 & 修复>”。');
});
```

- [x] **Step 5: Run message test RED, then remove manual HTML encoding**

Run: `npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "HTML entities"`

Expected: the current message contains literal `&lt;`/`&amp;` text. Remove `sanitizeHtml`; React text nodes already escape markup.

- [x] **Step 6: Refactor hard-coded component copy while GREEN**

Move component labels, accessible-name factories, table headings, status summaries, and operation-message factories into `taskUiText.ts`. Keep decoder errors in `taskBackup.ts` to avoid a domain-to-UI dependency.

- [x] **Step 7: Verify Task 2 GREEN**

Run: `npm test -- src/features/tasks/TaskWorkspace.test.tsx`

Expected: the complete workspace suite passes, including drawer focus and all existing accessible-name queries.

---

### Task 3: Local Calendar Date And Midnight Rollover

**Files:**
- Create: `src/lib/date.test.ts`
- Modify: `src/lib/date.ts`
- Modify: `src/features/tasks/TaskWorkspace.test.tsx`
- Modify: `src/features/tasks/TaskWorkspace.tsx`

**Interfaces:**
- Produces: `todayIso(date?: Date): string` using local calendar fields.
- Consumes: browser timers and `visibilitychange` to refresh workspace date state.

- [x] **Step 1: Add a local-date unit test**

```ts
it('uses local calendar fields instead of the UTC date', () => {
  const date = new Date('2026-01-01T16:30:00.000Z');
  vi.spyOn(date, 'getFullYear').mockReturnValue(2026);
  vi.spyOn(date, 'getMonth').mockReturnValue(0);
  vi.spyOn(date, 'getDate').mockReturnValue(2);
  expect(todayIso(date)).toBe('2026-01-02');
});
```

- [x] **Step 2: Run date test RED**

Run: `npm test -- src/lib/date.test.ts`

Expected: current `todayIso` ignores the argument and returns a UTC-derived date.

- [x] **Step 3: Implement local date formatting**

Format `getFullYear()`, `getMonth() + 1`, and `getDate()` with two-digit month/day padding. Keep `formatDate` defensive by returning its caller-provided fallback for invalid input instead of throwing; UI call sites supply `dueFilterLabels.none`.

- [x] **Step 4: Add a midnight rollover integration test**

Set fake time to local `2026-07-03 23:59:59.900`, render, switch to Today, verify the July 4 seed task is absent, advance past midnight, and verify it appears without remounting.

- [x] **Step 5: Run rollover test RED, then implement refresh scheduling**

Run: `npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "local midnight"`

Expected: current empty-dependency `useMemo` never updates. Replace it with date state, schedule the next local midnight, refresh on visible/focus, and clean up timer/listeners.

- [x] **Step 6: Verify Task 3 GREEN**

Run: `npm test -- src/lib/date.test.ts src/features/tasks/TaskWorkspace.test.tsx -t "local|midnight|today"`

Expected: local-date and rollover cases pass with existing Today-view tests.

---

### Task 4: Import Lifecycle And Ordering Correctness

**Files:**
- Modify: `src/features/tasks/TaskWorkspace.test.tsx`
- Modify: `src/features/tasks/TaskWorkspace.tsx`
- Modify: `src/features/tasks/TaskQuickAdd.tsx`
- Modify: `src/features/tasks/taskUiText.ts`
- Modify: `src/features/tasks/taskDomain.test.ts`
- Modify: `src/features/tasks/taskDomain.ts`

**Interfaces:**
- Produces: nullable pending-import state, last-request-wins import token, reset file input, `nextTaskSortOrder(tasks, status)`, and linear-time `moveTask` reconstruction.
- Consumes: full unfiltered task state when calculating column drop positions.

- [x] **Step 1: Add empty-backup and import-race tests**

Cover a valid `tasks: []` backup that still displays confirmation and replaces the library with zero tasks. Add two deferred `File.text()` promises and verify the earlier/slower file cannot replace the later preview; assert the file input is cleared after capture so the same path can be chosen again.

- [x] **Step 2: Run import lifecycle tests RED**

Run: `npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "empty backup|latest import|same file"`

Expected: empty imports have no buttons, stale reads overwrite newer state, and the input retains the selected file.

- [x] **Step 3: Implement nullable pending state and request tokens**

Use `Task[] | null`, render confirmation whenever it is non-null, invalidate outstanding reads on newer selection/cancel, and clear the native file input immediately after capturing its `File`. Enforce the 5 MiB file limit before `file.text()`.

- [x] **Step 4: Add filtered-drop and append-order tests**

Add a filtered cross-column background drop case that clears filters and asserts the moved item is last in the full target column. Add a target column containing an imported task with a future/high `sortOrder`, create through the column form, and assert the new task remains last.

- [x] **Step 5: Run ordering tests RED**

Run: `npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "filtered column drop|high sort order"`

Expected: the current code uses filtered target length and current-time sort order, so both assertions fail.

- [x] **Step 6: Implement full-state drop and explicit append order**

Compute column background target length inside the `setTasks(current => ...)` updater. Add `nextTaskSortOrder` to the pure domain module and pass it when creating a column task. Replace the nested `.find` in `moveTask` with an id map so reconstruction is `O(N + K log K)`.

- [x] **Step 7: Verify Task 4 GREEN**

Run:

```powershell
npm test -- src/features/tasks/taskDomain.test.ts
npm test -- src/features/tasks/TaskWorkspace.test.tsx
```

Expected: domain and complete workspace suites pass.

---

### Task 5: Documentation And Release Verification

**Files:**
- Modify: `ARCHITECTURE.md`
- Modify: `DESIGN.md`
- Modify: `README.md`
- Modify: `docs/optimization-roadmap.md`
- Modify: `.superpowers/sdd/progress.md`

**Interfaces:**
- Documents: component boundaries, overlay details on tablet/mobile, backup validation/limits, recoverable storage, local date semantics, and current multi-tab boundary.

- [x] **Step 1: Correct documentation drift**

Update `ARCHITECTURE.md` so it lists the split UI components instead of calling `TaskWorkspace` the only UI component. Update `DESIGN.md` so tablet/mobile detail behavior matches the implemented full-screen/overlay drawer rather than saying it sits below the main view.

- [x] **Step 2: Document hardening behavior and remaining boundary**

Add backup limits, invalid-snapshot recovery, empty backup replacement, local-day rollover, and last-selected import semantics. State that simultaneous multi-tab editing remains last-write-wins and is not conflict-merged.

- [x] **Step 3: Run complete automated verification**

```powershell
npm test
npm run build
git diff --check
```

Expected: every Vitest file passes, TypeScript and Vite build exit 0, and whitespace check exits 0.

- [x] **Step 4: Run Playwright browser acceptance**

At `1440x900`, `1024x768`, and `390x844`, verify initial rendering, quick add, column add, natural detail typing, empty/import confirmation, drawer focus/close, mobile filter disclosure, no page horizontal overflow, no overlap, no broken assets, and no console errors. Save fresh screenshots under `output/playwright/`.

- [x] **Step 5: Final review**

Review the full working-tree diff against this plan and the four project guidance documents. Run the full verification commands again after any review fix.

---

## Self-Review

Spec coverage:

- The plan covers every high-confidence correctness issue from the intent, reliability, security, contracts, and UI audit passes.
- It preserves current product scope and explicitly records multi-tab conflict merging as the one deferred architectural capability.
- It includes failing tests before every production behavior change and browser checks for the user-facing workflows.

Placeholder scan:

- No `TBD`, generic error-handling instruction, undefined future function, or code-change step without an exact test/command remains.

Type consistency:

- `decodeTaskArray` returns `Task[] | undefined`; an empty valid array remains distinguishable from invalid data.
- Pending imports use `Task[] | null`; `[]` means a valid empty import and `null` means no pending import.
- Date state remains a `YYYY-MM-DD` string and all existing domain APIs continue to accept it unchanged.
