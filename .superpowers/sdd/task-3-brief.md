# Task 3 Brief: Documentation And Final Verification

## Goal

Update project docs to match the completed stale-selection cleanup and workspace component split, then verify the entire project.

## Files

- Modify `README.md`
- Modify `docs/optimization-roadmap.md`
- Read/verify the release-polish changes under `src/features/tasks`

## Required documentation

1. Preserve every existing README section. In `## 当前边界`, state that the workspace rendering has been split into clearer UI components while task state remains orchestrated in the main workspace. Preserve the existing account/cloud/collaboration/integration boundary and drag/order/legacy-field notes. Add that replace import, delete, and bulk operations clear invalid selections so stale bulk state does not remain.
2. Append a release-stability phase to the optimization roadmap covering:
   - stale selection cleanup after import replacement, delete, and bulk operations;
   - the five smaller UI units: quick add, toolbar, bulk actions, task views, detail panel;
   - domain and backup rules remain centralized in their existing modules;
   - current Vitest UI coverage protects create/filter/import/drag/bulk/detail behavior;
   - the phase is complete and verified by tests/build.
3. Number this roadmap section `### 第十一批：发布级稳定优化`, not the stale plan's `第十批`, because the current roadmap already contains and completes `第十批：工作台上下文一致性与反馈`.

## Verification

1. Run `npm test` and record exact file/test counts.
2. Run `npm run build` and record TypeScript/Vite success.
3. Inspect `git status --short` and the scoped source/docs contents for accidental unrelated edits. Because nearly all project files started untracked, normal `git diff` cannot show their history; do not stage or commit just to manufacture a diff.
4. Self-review docs against the actual component filenames and Task 1 behavior.

## Constraints

- Chinese prose, concise existing documentation style.
- No source changes during this task unless verification exposes a genuine defect; report such a defect instead of silently expanding scope.
- Use `apply_patch` for edits. Do not commit.

## Report

Write `.superpowers/sdd/task-3-report.md` with status, exact doc changes, test/build output, status review, and concerns. Return only status, one-line verification summary, and concerns.
