### Task 4: Overlay Detail Drawer

**Files:**
- Modify: `src/features/tasks/TaskWorkspace.tsx`
- Modify: `src/features/tasks/TaskViews.tsx`
- Modify: `src/features/tasks/TaskDetailPanel.tsx`
- Modify: `src/features/tasks/TaskWorkspace.test.tsx`

**Interfaces:**
- `showDetail` defaults to `false`.
- `TaskViews` uses `onOpenDetail(task)` for both board cards and list detail actions.
- `TaskWorkspace` renders `.detail-layer`, `.detail-scrim`, and the existing `TaskDetailPanel` outside `.content-grid`.

- [ ] **Step 1: Replace the accidental default-open test with drawer behavior tests**

Update the board detail test and add selection persistence:

```tsx
  it('opens the detail drawer from a board card without squeezing the task canvas', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    expect(screen.queryByLabelText('任务详情')).not.toBeInTheDocument();
    expect(screen.getByLabelText('任务画布')).not.toHaveClass('detail-collapsed');

    await user.click(screen.getByText('任务管理库第一篇文档'));

    expect(screen.getByLabelText('任务详情')).toBeInTheDocument();
    expect(screen.getByLabelText('详情标题')).toHaveValue('任务管理库第一篇文档');
    expect(screen.getByLabelText('任务详情层')).toBeInTheDocument();
  });

  it('keeps the selected task when the detail drawer is closed and reopened', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByText('任务管理库第一篇文档'));
    await user.click(screen.getByRole('button', { name: '关闭详情面板' }));
    await user.click(screen.getByRole('button', { name: '显示详情' }));

    expect(screen.getByLabelText('详情标题')).toHaveValue('任务管理库第一篇文档');
  });
```

For existing tests that edit detail fields, explicitly click the intended task before querying the drawer.

Migrate every existing default-open assumption explicitly:

- `updates the detail panel to the first visible task after filtering`: click `任务管理库第一篇文档` to open the drawer before filtering.
- `uses the current view context for the detail empty state`: switch to Completed, then click `显示详情` before querying the contextual empty copy.
- `can collapse and restore the task detail panel` and `can collapse the detail panel from the detail header`: click `整理本周重点任务` before the initial detail assertion.
- `updates the detail panel to the first today task in the today view`: its initial task click opens the drawer; keep it open through the view switch.
- `updates the detail panel to the first completed task in the completed view`: after switching to Completed, click the completed task before asserting its title.
- `labels toolbar filters and detail fields for assistive technology`: click `整理本周重点任务` before querying detail field labels.

- [ ] **Step 2: Run and verify RED**

```bash
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "detail drawer|selected task"
```

Expected: FAIL because details start open, board cards do not invoke `onOpenDetail`, and `任务详情层` does not exist.

- [ ] **Step 3: Implement drawer orchestration**

Set:

```tsx
const [showDetail, setShowDetail] = useState(false);
```

Change the canvas to:

```tsx
<div className="content-grid" aria-label="任务画布">
  <TaskViews ... />
</div>
{showDetail && (
  <div className="detail-layer" aria-label="任务详情层">
    <div className="detail-scrim" aria-hidden="true" onClick={() => setShowDetail(false)} />
    <TaskDetailPanel ... />
  </div>
)}
```

In `TaskViews`, board card clicks call `onOpenDetail(task)` instead of only `onSelectTask(task.id)`. Checkbox and completion button clicks must continue to stop propagation. Keep `onSelectTask` for row selection if still required, but use `onOpenDetail` for direct task activation.

- [ ] **Step 4: Verify Task 4**

```bash
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "detail|drawer|selected task"
npm test -- src/features/tasks/TaskWorkspace.test.tsx
```

Expected: drawer tests and complete workspace tests PASS; no duplicate `关闭详情面板` accessible name is introduced by the decorative scrim.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/features/tasks/TaskWorkspace.tsx src/features/tasks/TaskViews.tsx src/features/tasks/TaskDetailPanel.tsx src/features/tasks/TaskWorkspace.test.tsx
git commit -m "feat: move task details into an overlay drawer"
```

---

