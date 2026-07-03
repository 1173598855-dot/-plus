# Personal Task Manager Release Polish Design

## Purpose

This optimization pass turns the existing local-first task manager into a more publishable and maintainable product without changing its core identity. The app should still feel like a quiet personal workbench: quick to open, easy to scan, safe with local data, and simple enough to keep evolving.

The current feature set is already broad enough for a first release. The next best step is not a large feature wave. It is a stability and polish pass that protects existing behavior, improves maintainability, and removes small rough edges that users notice during daily use.

## Success Criteria

- Existing task flows keep working: create, edit, complete, reopen, delete, filter, switch views, import, export, drag tasks, reorder tasks, bulk operate, and collapse details.
- The main task workspace is easier to maintain because rendering, form controls, toolbar/filter controls, bulk actions, and detail editing have clearer boundaries.
- User-visible polish improves without lowering information density or changing the restrained product UI.
- Tests cover the preserved behavior and any new boundary behavior introduced by the polish pass.
- `npm test` and `npm run build` pass before the work is considered complete.

## Recommended Approach

Use a release-grade stabilization pass.

This approach avoids adding major capabilities such as calendar view, recurring tasks, templates, or analytics in this iteration. Those are still valid future work, but they should happen after the current workspace is split into smaller units and protected by tests.

The alternative approaches were:

- Feature expansion first: higher visible novelty, but it would add more behavior to an already large component.
- Pure engineering refactor first: useful for maintainability, but weaker user-facing value.

The recommended path balances both: preserve the product, improve the code shape, and add small user-facing polish where it naturally falls out of the cleanup.

## Scope

### Component Boundaries

Split `TaskWorkspace.tsx` into smaller, task-focused pieces while keeping the same data ownership at the workspace level.

Likely boundaries:

- Quick add and backup controls.
- Toolbar, view switch, search, and filters.
- Bulk action bar.
- Board/list/today/completed task views.
- Task card and task row rendering.
- Detail panel editing.

The workspace component should remain the orchestration point for task state, selected task, filters, import state, drag state, and cross-component callbacks. Child components should receive explicit props and avoid owning duplicated task state.

### Interaction Polish

Keep polish practical and low risk:

- Clear stale selected task ids when tasks disappear after deletion, import replacement, or filtering-sensitive flows where stale selection would confuse bulk actions.
- Keep feedback messages direct and consistent after import, export, bulk actions, and drag operations.
- Preserve keyboard shortcuts and form-field behavior.
- Preserve the detail-panel collapse model while making empty and no-selection states read naturally.

### Testing

Keep existing UI and domain tests. Add or adjust tests only where the refactor introduces a meaningful boundary or where polish changes behavior.

Important coverage:

- Bulk selection clears after destructive operations.
- Import replacement does not leave invalid selection state.
- Filters and empty states still behave across board, list, today, and completed views.
- Keyboard shortcuts still avoid firing while typing.
- Drag and reorder behavior still moves tasks correctly.

### Documentation

Update project documentation only where it helps users or future maintainers:

- README should describe the app, setup, test, build, and current boundaries accurately.
- Optimization roadmap should distinguish completed work from the next recommended phase.
- Avoid documenting internal implementation details that will quickly drift.

## Out Of Scope

- Accounts, cloud sync, collaboration, or external integrations.
- Calendar view, recurring tasks, templates, analytics, notifications, or time tracking.
- New dependencies unless a clear existing problem cannot be solved with current tools.
- Visual redesign that changes the restrained workbench identity.
- Replacing localStorage persistence.

## Architecture Notes

The domain module remains responsible for task normalization, validation, filtering, sorting, grouping, summary calculation, and moving/reordering. UI components should not reimplement this logic.

The backup module remains responsible for parsing and validating imported task JSON. UI code should call it and respond to success or failure, not inspect JSON itself.

The workspace-level state model is acceptable for this iteration. A reducer may be introduced only if it reduces real duplication or makes multi-step state transitions clearer. Avoid a broad state-management rewrite.

## Error Handling

Existing user-facing error messages should stay in Chinese and remain direct. Import errors should continue to distinguish invalid JSON from structurally invalid task data. Storage failure should still show a clear local persistence warning.

## Verification

Before completion:

1. Run `npm test`.
2. Run `npm run build`.
3. Manually inspect the app if UI layout changes are substantial.

Completion requires passing automated checks and preserving the documented user flows.
