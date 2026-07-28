# Board Inline Quick Add Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accessible title-only creation form to each unfiltered board column without regressing the validated workbench layout.

**Architecture:** `TaskViews` owns ephemeral per-column title drafts and emits `onAddTaskToColumn(title, status)`. `TaskWorkspace` remains the only task-state owner and creates tasks through `createTask`; the existing persistence effect stores them. UI copy remains centralized in `taskUiText.ts`, while CSS preserves the established full-height shell.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, plain CSS, lucide-react.

## Global Constraints

- Do not add dependencies or change the task model, backup JSON format, storage key, domain defaults, drag/reorder behavior, bulk actions, or detail drawer lifecycle.
- Keep all newly introduced Chinese UI copy in `src/features/tasks/taskUiText.ts`.
- Hide column quick-add forms whenever any active filter, search, or hide-completed mode is enabled.
- Preserve `.workspace { min-height: 100dvh; }`, `.rail { max-height: 100dvh; }`, `.column { min-height: calc(100dvh - 178px); }`, and mobile `.detail { min-height: 100dvh; }`.
- Keep the column input and submit button at least `40px` high on desktop and mobile.
- `npm test`, `npm run build`, browser acceptance, and `git diff --check` must pass.

---

### Task 1: Board Column Creation Behavior

**Files:**
- Modify: `src/features/tasks/TaskWorkspace.test.tsx`
- Modify: `src/features/tasks/taskUiText.ts`
- Modify: `src/features/tasks/TaskViews.tsx`
- Modify: `src/features/tasks/TaskWorkspace.tsx`

**Interfaces:**
- Produces: `onAddTaskToColumn(title: string, status: TaskStatus): void`.
- Consumes: `createTask`, `statusLabels`, `hasActiveFilters`, and the existing workspace persistence effect.

- [ ] **Step 1: Add failing behavior tests**

Add tests that use the status-specific form/input/button accessible names and verify:

```tsx
it('creates and persists a trimmed task in a board column with Enter', async () => {
  const user = userEvent.setup();
  render(<TaskWorkspace />);
  const form = screen.getByRole('form', { name: '在下一步中新建任务' });
  const input = within(form).getByRole('textbox', { name: '下一步任务标题' });

  await user.type(input, '  列内捕捉任务  {Enter}');

  expect(within(screen.getByLabelText('下一步栏')).getByText('列内捕捉任务')).toBeInTheDocument();
  expect(input).toHaveValue('');
  expect(input).toHaveFocus();
  expect(screen.getByRole('status')).toHaveTextContent('已在下一步创建任务“列内捕捉任务”。');
  await waitFor(() => expect(localStorage.getItem('personal-task-manager.tasks.v1')).toContain('列内捕捉任务'));
});
```

Add separate tests for the Plus button and independent drafts, completed-column `completedAt`, composition `Enter`, and hiding/restoring forms around active filters.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "board column|column drafts|composition|filtered board"
```

Expected: FAIL because the interrupted implementation lacks the specified form semantics/names, composition guard, filter behavior, and complete regression coverage.

- [ ] **Step 3: Centralize copy and implement the form**

Add to `taskUiText.ts`:

```ts
export const columnQuickAddLabels = {
  form: (status: string) => `在${status}中新建任务`,
  title: (status: string) => `${status}任务标题`,
  submit: (status: string) => `添加到${status}`,
  placeholder: '添加任务',
  created: (status: string, title: string) => `已在${status}创建任务“${title}”。`,
} as const;
```

In `TaskViews`, keep drafts in `Partial<Record<TaskStatus, string>>`, render an accessible `<form>` only when `!hasActiveFilters`, ignore Enter while `event.nativeEvent.isComposing`, trim before calling `onAddTaskToColumn`, and clear only the submitted status draft.

- [ ] **Step 4: Complete workspace creation**

Implement `addTaskToColumn` with the existing `createTask` clock path. Set the task status, prepend it to `tasks`, select it without opening the drawer, and use `columnQuickAddLabels.created` for the live-region message. React performs text escaping, so do not HTML-encode this new message.

- [ ] **Step 5: Run focused and workspace tests GREEN**

Run:

```powershell
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "board column|column drafts|composition|filtered board"
npm test -- src/features/tasks/TaskWorkspace.test.tsx
```

Expected: all focused tests and the complete workspace suite PASS.

---

### Task 2: Responsive Layout And Regression Closure

**Files:**
- Modify: `src/app/App.css.test.ts`
- Modify: `src/app/App.css`
- Modify: `README.md`
- Modify: `docs/optimization-roadmap.md`

**Interfaces:**
- Consumes: `.column-add`, `.workspace`, `.rail`, `.column`, and mobile `.detail` CSS hooks.
- Produces: a compact two-control row with a `40px` minimum target and preserved full-height shell.

- [ ] **Step 1: Add failing CSS contracts**

Add assertions that the four full-height values match the Global Constraints, `.column-add` has a `12px` top gap, and both `.column-add input` and `.column-add-btn` use `min-height: 40px`.

- [ ] **Step 2: Run CSS tests and verify RED**

Run:

```powershell
npm test -- src/app/App.css.test.ts -t "column quick add|full-height workbench"
```

Expected: FAIL because the interrupted CSS removed the viewport-height contracts, uses a `32px` input and `28px` button, and has no top gap.

- [ ] **Step 3: Implement the visual contract**

Restore the four validated viewport-height declarations. Style `.column-add` as a quiet grid row with `grid-template-columns: minmax(0, 1fr) 40px`, `gap: 6px`, and `margin-top: 12px`; keep input and button at `40px`, use existing radius/focus/color tokens, and remove trailing whitespace/blank lines. Do not add a framed wrapper around the already framed input and button.

- [ ] **Step 4: Update user-facing documentation**

Add the board-column quick-add behavior and its unfiltered scope to `README.md`. Append a completed twelfth batch to `docs/optimization-roadmap.md` describing the feature and its tests.

- [ ] **Step 5: Run automated verification**

Run:

```powershell
npm test -- src/app/App.css.test.ts
npm test
npm run build
git diff --check
```

Expected: all tests and build PASS; whitespace check exits 0.

- [ ] **Step 6: Browser acceptance**

At `1440x900`, `1024x768`, and `390x844`, verify Enter/button creation, independent drafts, filter hiding/restoration, column height, sticky rail, `40px` mobile controls, zero page horizontal overflow, and zero console errors. Save final screenshots under `output/playwright/`.

- [ ] **Step 7: Commit**

```powershell
git add docs/superpowers/specs/2026-07-28-board-inline-quick-add-design.md docs/superpowers/plans/2026-07-28-board-inline-quick-add.md src/features/tasks/TaskWorkspace.test.tsx src/features/tasks/taskUiText.ts src/features/tasks/TaskViews.tsx src/features/tasks/TaskWorkspace.tsx src/app/App.css.test.ts src/app/App.css README.md docs/optimization-roadmap.md
git commit -m "feat: add board column quick capture"
```
