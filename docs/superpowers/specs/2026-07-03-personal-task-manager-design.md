# Personal Task Manager Design

Date: 2026-07-03

## Goal
Build a local-first personal task management app that is useful immediately, simple to run, and structured so storage or synchronization can be upgraded later without rewriting the UI.

## References
- Plane: learn from clear project/task boundaries and multiple work views, but avoid its team-scale complexity.
- Super Productivity: borrow the personal-first focus, privacy, and time-oriented workflow ideas.
- Vikunja: borrow the practical task model: lists, labels, dates, priority, and status.
- Wekan: borrow the kanban mental model, but keep drag-and-drop optional for a later version.

## Recommended Approach
Use React, TypeScript, Vite, and Vitest. Persist task data through a small storage adapter backed by localStorage in the browser. Keep domain logic in testable pure TypeScript modules and keep React components focused on rendering and interaction.

## Initial Product Scope
The first version opens directly into the task workspace, not a marketing landing page. It includes:

- Create, edit, complete, and delete tasks.
- Task fields: title, notes, status, priority, due date, project, labels, created date, updated date.
- List and board-style status grouping.
- Search and filters for status, priority, project, label, and due date buckets.
- Dashboard summary for total, active, completed, overdue, and due-today tasks.
- Local browser persistence.

## Architecture
The app is split into three layers:

1. `features/tasks`: task model, reducer-style operations, selectors, seed data, and task UI.
2. `lib`: reusable infrastructure such as localStorage helpers and ID/date utilities.
3. `app`: application shell and composition.

The task service exposes pure functions for creating, updating, filtering, summarizing, and grouping tasks. React state uses these functions and persists the resulting task list through the storage adapter.

## Data Model
A task has:

- `id`: stable string identifier.
- `title`: required non-empty string.
- `notes`: optional string.
- `status`: `inbox`, `next`, `scheduled`, `waiting`, or `done`.
- `priority`: `low`, `medium`, `high`, or `urgent`.
- `dueDate`: ISO date string or empty.
- `project`: optional string.
- `labels`: string array.
- `createdAt`: ISO timestamp.
- `updatedAt`: ISO timestamp.
- `completedAt`: ISO timestamp or empty.

## Error Handling
Invalid task input is rejected in the domain layer before UI state changes. LocalStorage read failures fall back to seed tasks and do not crash the app. LocalStorage write failures are surfaced as a non-blocking message in the UI.

## Testing
Use Vitest for pure task logic and storage behavior. The first implementation tasks must be test-first: write failing tests for task creation, update, filtering, grouping, summary counts, and storage fallback before adding production code.

## Non-Goals For First Version
- User accounts.
- Cloud sync.
- Multi-user collaboration.
- Rich drag-and-drop board behavior.
- External integrations.

## Success Criteria
- `npm install` works from a fresh checkout.
- `npm test` passes.
- `npm run build` passes.
- `npm run dev` starts a usable local app.
- A user can manage tasks entirely in the browser with data surviving refreshes.
