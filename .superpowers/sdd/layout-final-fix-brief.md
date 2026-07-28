# Workbench Layout Final Review Fix Brief

Base commit: `b54c056`

Implement all findings below in one TDD-driven fix wave. Preserve task domain, storage, backup, import/export, drag/reorder, bulk operations, and current visual layout.

## Important 1: Empty Drawer Exit

- Move the detail header and close button outside the `task` conditional in `TaskDetailPanel`.
- Keep the delete action conditional on a selected task.
- The empty detail state must always have a visible, keyboard-operable close action on desktop and mobile.
- Add a regression test that opens the Completed empty drawer and closes it.

## Important 2: Modal And Focus Lifecycle

- Give `.detail-layer` `role="dialog"`, `aria-modal="true"`, and an accessible relationship to a stable detail heading id.
- On open, move focus into the drawer, preferably to the close button.
- Trap `Tab` and `Shift+Tab` inside the drawer while open.
- Close on `Escape`.
- Restore focus to the focusable trigger that opened the drawer when it still exists.
- Make the rail and the toolbar/canvas background inert while the drawer is open. Do not make the dialog inert.
- Global `/`, `n`, and `1`-`4` shortcuts must not operate behind the modal drawer.
- Add behavior tests for modal semantics, initial focus, focus containment, Escape, shortcut blocking, inert background, and focus restoration.

## Important 3: Keyboard-Accessible Board Details

- Add an explicit Lucide `PanelRightOpen` detail button to every board card with accessible name `查看详情：<task title>`.
- Do not turn the whole article into a pseudo-button because it contains checkbox and button descendants.
- Keep card click opening behavior for pointer users.
- Ensure the new button does not distort desktop/mobile card layout or violate the mobile 40px target rule.
- Test keyboard activation of the board detail button and focus restoration after close.

## Minor Closure

- Hide an empty-state artwork after its `error` event while preserving message and clear-filter action. A later different artwork variant must still be eligible to render.
- Reuse `toolbarLabels.clearFilters` in `TaskEmptyState`.
- Derive list empty-state variants from explicit semantic variants/view mode, not Chinese display labels.
- Add explicit tests for: quick-add remains expanded after task creation; mobile filter `aria-controls`, expanded state, and second-click collapse; list detail activation; checkbox/completion actions do not open drawer; scrim closes the drawer.
- Remove the four trailing spaces in `TaskWorkspace.test.tsx` so `git diff --check b3bc629..HEAD` passes.

## Verification And Report

- Follow RED/GREEN for every production behavior change. Record exact commands, expected failures, and passing counts.
- Run the focused workspace tests, full `TaskWorkspace.test.tsx`, `App.css.test.ts`, full `npm test`, and `npm run build`.
- Run Playwright at `1440x900` and `390x844`: verify board detail button keyboard activation, modal semantics/focus/Escape/restore, empty drawer close, 0 page overflow, and 0 console errors. Recheck screenshots if CSS changes.
- Write `.superpowers/sdd/layout-final-fix-report.md` with files, TDD evidence, browser measurements, self-review, and concerns.
- Commit all and only final-fix source/tests/report files as `fix: complete drawer accessibility`.
