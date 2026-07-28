# Final Review Fix Brief

## Findings to fix

### 1. Filter container CSS contract

`TaskToolbar.tsx` renders class `toolbar-filters`, while all intended desktop/mobile filter layout styles in `App.css` target `filter-strip`. Add a UI regression assertion that the status filter is contained by `.filter-strip`, observe RED, then change the component class to the established class. Do not duplicate/rename CSS rules.

### 2. Hidden selections reappear

The actual-task pruning effect is required, but the prior visible-scope pruning behavior must also remain. Add a regression test:

- select seeded task `整理本周重点任务`;
- filter project to `个人任务管理库` so it becomes invisible and the bulk bar disappears;
- clear filters;
- assert the selected-count bar does not reappear.

Observe RED before implementation. Restore a visible-scope pruning effect based on `visibleDetailTasks`, with a no-op state return when no ids change. Keep the existing actual-`tasks` pruning and invalid detail-id fallback from Task 1.

## Verification

- Run each new test alone for RED, then GREEN.
- Run full `TaskWorkspace.test.tsx`.
- Run `npm test` and `npm run build`.
- Review only the scoped files: `TaskToolbar.tsx`, `TaskWorkspace.tsx`, `TaskWorkspace.test.tsx` (and `App.css.test.ts` only if truly needed).
- Use `apply_patch`; do not commit or alter docs/dependencies.

## Report

Append exact RED/GREEN commands/results and self-review to `.superpowers/sdd/final-fix-report.md`. Return status, verification summary, concerns.
