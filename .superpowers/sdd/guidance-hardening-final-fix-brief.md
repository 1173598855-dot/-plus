# Guidance Hardening Final Review Fix Brief

## Context

This is the single fix wave after the read-only whole-branch review of
`0e6d314..8c783ae`. Work on branch `fix/guidance-hardening-final-review`.
Preserve the plan's architecture and all existing behavior. Do not add
dependencies, remote resources, accounts, state frameworks, or unrelated
refactors.

Read and follow `superpowers:test-driven-development` before changing
production code. For every behavior below, add the smallest regression test,
run it and record the expected RED failure, then implement the minimal fix and
record GREEN. Commit the complete fix wave after self-review.

## Binding Global Constraints

- Storage key remains exactly `personal-task-manager.tasks.v1`; object backup
  version remains exactly `1`.
- Preserve raw task-array imports and legacy tasks missing `sortOrder`,
  `estimateMinutes`, or `energy`.
- `TaskWorkspace` remains the only owner of the task array.
- User-facing Chinese copy stays in `taskUiText.ts`. Decoder error constants
  stay in `taskBackup.ts` and are exported for tests.
- Persisted/imported state is capped at 10,000 tasks, with unique non-empty ids,
  non-empty titles, valid dates/timestamps, bounded text/labels, and no unknown
  persisted fields.
- Invalid or unavailable storage must not be overwritten implicitly. Recovery
  exposes retry and explicit reset; raw download is available whenever an
  invalid raw value is known.
- Preserve create, edit, filter, view, bulk, drag, backup, keyboard, drawer,
  responsive, focus, and reduced-motion behavior.

## Findings To Fix

### 1. Storage recovery must retain explicit write protection (Critical)

Current root cause: `readStoredTasks()` collapses `missing` and `unavailable`
to the same `{ recoveryRaw: null }` state. The persistence effect treats null
as writable, while `retryStorage()` always replaces current tasks with the
read result. A temporarily unavailable getter can therefore allow seed tasks
to overwrite a recovered snapshot, and a failed retry can discard edits made
while recovery is blocked.

Required behavior:

- Keep an explicit storage/recovery status independent of whether raw text is
  available. Both invalid schema/JSON and unavailable storage block automatic
  persistence.
- A failed/invalid/unavailable retry preserves the currently displayed tasks
  and remains blocked. If an invalid raw value was already known, retain it so
  download remains available.
- A successful valid retry may adopt the valid snapshot and unblock. A missing
  result may unblock while preserving current displayed tasks. Explicit reset
  and confirmed import replacement/merge may unblock.
- If `saveJson` itself throws, transition to a visible blocked/not-saved state.
- Recovery controls remain visible while blocked; show download only when raw
  data exists, but retry and explicit reset must also exist for unavailable
  storage.
- Add regression tests proving: a startup read failure followed by write
  recovery does not overwrite storage automatically; edits made while blocked
  survive another failed retry; a known invalid raw value survives an
  unavailable retry; explicit recovery still resumes persistence.

### 2. Every write path must remain decodable (Critical)

Current root cause: decoder limits (title 500, notes 20,000, project 200,
labels 50 x 100, total tasks 10,000, id 200) are enforced only during decode.
Create/detail editing and merge can persist values or a total task count that
the next mount rejects.

Required behavior:

- Define one shared source of schema limits usable by decoder and domain/UI
  write paths without introducing an inverted domain-to-UI dependency.
- Normal create/update flows must never persist fields outside decoder bounds.
  Apply suitable input limits and domain-level normalization/validation so
  programmatic callers are also safe. Preserve natural multi-word/comma typing.
- Reject a merge if the final unique task total would exceed 10,000. Do not
  partially mutate tasks, clear the pending import, or unblock damaged storage
  on rejection. Announce the reason using copy from `taskUiText.ts`.
- Add round-trip tests showing tasks produced by create/update remain accepted
  by `decodeTaskArray`, plus a merge-over-limit behavior test.

### 3. Extreme sort orders must append deterministically (Important)

Current root cause: for `Number.MAX_VALUE`, `highest + 1000 === highest`.
The existing workspace test uses equal timestamps, so stable sort makes it pass
without proving a strictly later order.

Required behavior:

- If a proposed append order is non-finite or not strictly greater than the
  target column maximum, renumber/normalize that target column (or apply an
  equivalent safe-order strategy) and append the new task last.
- Preserve the public behavior of ordinary column append and drag ordering.
- Strengthen tests with distinct timestamps and assert both rendered order and
  persisted/returned sort order values, including `Number.MAX_VALUE`.

### 4. Recovery-state messages must not claim persistence (Important)

Current root cause: quick creation always uses `taskCreated(...系统已持久化)`
even when the persistence effect is blocked.

Required behavior:

- While storage is blocked, keep a continuously visible not-saved/recovery
  indication and use truthful operation copy for create/edit-capable flows.
- Do not claim persistence for an in-memory-only task. Preserve the existing
  persisted success message in the normal ready state.
- Add an accessible UI regression test for the blocked-state message.

### 5. Close the two documentation/copy findings (Minor)

- Remove the hard-coded Chinese empty-date label from `src/lib/date.ts`; supply
  UI copy from `taskUiText.ts` at UI call sites while keeping `date.ts` generic.
- Export decoder error constants from `taskBackup.ts` and use them in tests.
- Correct `ARCHITECTURE.md`: domain functions do not read the current time or
  external state; `createTask` currently parses the injected timestamp, so do
  not claim the module never touches `Date` unless production code is changed
  to make that statement true.

## Required Verification

Run focused tests after each RED/GREEN cycle. Before committing, run:

```powershell
npm test
npm run build
git diff --check
```

Write the complete report to
`.superpowers/sdd/guidance-hardening-final-fix-report.md`. Include:

- each RED test command and the expected failure observed;
- each GREEN/final command and exact pass counts;
- files changed and design decisions;
- self-review notes and any remaining concerns;
- final commit SHA.

Return only `DONE`, the commit SHA, a one-line verification summary, and any
concerns after the report is written.
