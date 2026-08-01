# Release Polish Progress

Plan: `docs/superpowers/plans/2026-07-03-release-polish.md`

Task 1: complete (untracked baseline, independent review clean; UI tests 32/32)
Task 2: complete (untracked baseline, independent review approved; tests 54/54; build pass)
Minor ledger: `TaskViewMode` is exported by `TaskToolbar.tsx` and shared by Workspace/Views; consider a neutral UI types module only if future view types expand.
Task 3: complete (independent review clean; docs accurate; tests 54/54; build pass)
Final review: complete after two Important fixes (filter CSS contract and visible-scope selection pruning); re-review Ready; tests 56/56; build pass.

## Workbench Layout Optimization

Plan: `docs/superpowers/plans/2026-07-26-workbench-layout-optimization.md`

Baseline: normal `main` checkout retained because application source is untracked; tests 56/56 pass.
Task 1: complete (commits b3bc629..5380d6e, spec PASS, quality APPROVED; tests 59/59; build pass).
Minor ledger: `TaskEmptyState` duplicates `toolbarLabels.clearFilters`; `TaskViews` derives empty-state variants from Chinese labels; `TaskWorkspace.test.tsx` has four pre-existing trailing-space lines. Revisit during final review.
Task 2: complete (commits 5380d6e..0542c08, spec PASS, quality APPROVED; TaskWorkspace tests 37/37; build pass).
Minor ledger: add an explicit assertion that quick-add remains expanded after task creation if final review deems it necessary.
Task 3: complete (commits 0542c08..da0348a, spec PASS, quality APPROVED; TaskWorkspace tests 39/39; build pass).
Minor ledger: mobile filter disclosure test does not explicitly assert expanded `aria-expanded`, `aria-controls`, and a second-click collapse cycle.
Task 4: complete (commits da0348a..fb54f38, spec PASS within Task 4 boundary, quality APPROVED; drawer tests 13/13, TaskWorkspace tests 40/40; build pass).
Minor ledger: consider explicit tests for list activation, checkbox/completion propagation not opening the drawer, and scrim close; final overlay CSS is required in Task 5.
Task 5: complete (commits fb54f38..b54c056, spec PASS, code quality PASS, task quality APPROVED; CSS 11/11, all tests 71/71; build and three-viewport Playwright acceptance pass).

## Board Inline Quick Add

Plan: `docs/superpowers/plans/2026-07-28-board-inline-quick-add.md`

Task 1: complete (commit 9828894, spec PASS, task quality APPROVED; focused behavior tests 7/7, TaskWorkspace tests 55/55, typecheck pass).
Task 2: complete (commit 96617b7). Verified 2026-07-28 in Linux sandbox: taskDomain/taskBackup/storage 20/20 pass, App.css.test.ts 14/14 pass, tsc --noEmit clean, `vite build` succeeds (1789 modules). TaskWorkspace.test.tsx (jsdom) could not be executed here — node_modules is on a slow 9p mount and jsdom cold load exceeds the shell's 44s cap; not a code issue. Uncommitted working-tree diff is pure CRLF/LF line-ending noise (`git diff --ignore-space-at-eol` is empty), no real changes pending.

Note: a stale empty `.git/index.lock` remains (sandbox cannot delete on the 9p mount) — remove it from Windows before the next commit.

## Guidance Audit Hardening

Plan: `docs/superpowers/plans/2026-07-28-guidance-audit-hardening.md`

Task 1: complete (commits a908293..02e3cad; strict decoder, recoverable storage; taskBackup 22/22, storage 7/7, focused workspace recovery 8/8; typecheck and diff check pass).
Task 2: complete (commit bf84c7d; natural detail editing and centralized UI copy; TaskWorkspace 64/64; typecheck and diff check pass).
Task 3: complete (commit b2afb06; local calendar date and midnight/focus/visibility refresh; related tests 67/67; typecheck and diff check pass).
Task 4: complete (commit dd4707e; empty/race-safe imports, 5 MiB limit, full-state drops, explicit append ordering, linear reconstruction; taskDomain 11/11, TaskWorkspace 72/72; typecheck and diff check pass).
Task 5: complete (documentation updated; all tests 128/128, build and diff check pass; Playwright acceptance passed at 1440x900, 1024x768, and 390x844 with no page overflow, broken assets, console errors, or focus regressions).
Final hardening review: complete (commit ee2d4b0; explicit storage write blocking, decodable write limits, extreme sort-order recovery, truthful blocked-state feedback, and remaining copy/documentation findings). Fresh verification on 2026-08-02: 6 Vitest files / 134 tests, production build, and `git diff --check` passed.
