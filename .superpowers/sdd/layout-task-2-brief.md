### Task 2: Progressive Quick Add

**Files:**
- Modify: `src/features/tasks/TaskWorkspace.tsx`
- Modify: `src/features/tasks/TaskQuickAdd.tsx`
- Modify: `src/features/tasks/taskUiText.ts`
- Modify: `src/features/tasks/TaskWorkspace.test.tsx`

**Interfaces:**
- `TaskWorkspace` produces `isQuickAddExpanded: boolean` and `setIsQuickAddExpanded(value: boolean)`.
- `TaskQuickAddProps` adds `isExpanded: boolean` and `onExpandedChange(isExpanded: boolean): void`.
- The title input and Add button remain mounted in both states.

- [ ] **Step 1: Add failing disclosure and shortcut tests**

Add:

```tsx
  it('progressively discloses quick-add details', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    expect(screen.getByLabelText('任务标题')).toBeInTheDocument();
    expect(screen.queryByLabelText('任务备注')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '展开详细字段' }));
    expect(screen.getByLabelText('任务备注')).toBeInTheDocument();
    expect(screen.getByLabelText('任务状态')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '收起详细字段' }));
    expect(screen.queryByLabelText('任务备注')).not.toBeInTheDocument();
  });

  it('expands quick add and focuses its title with the n shortcut', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.keyboard('n');

    expect(await screen.findByLabelText('任务备注')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('任务标题')).toHaveFocus());
  });
```

Update the existing `creates a task and persists it to localStorage` test to click `展开详细字段` before querying estimate, energy, project, and labels. Update `includes overdue tasks in the today execution view` to expand before querying the due-date input. Tests that only type the task title remain unchanged because the title is always mounted.

- [ ] **Step 2: Run tests and verify RED**

```bash
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "progressively discloses|expands quick add"
```

Expected: FAIL because the disclosure buttons do not exist and details are always mounted.

- [ ] **Step 3: Add labels and props**

Add to `quickAddLabels`:

```ts
expandDetails: '展开详细字段',
collapseDetails: '收起详细字段',
```

Add `isExpanded` and `onExpandedChange` to `TaskQuickAddProps`. Render the title and primary Add button in a `.quick-capture-row`; render the existing notes/metadata fields inside:

```tsx
{isExpanded && <div className="quick-add-fields">...</div>}
```

Use a Lucide `ChevronDown`/`ChevronUp` icon-only button with the exact accessible names from `quickAddLabels`.

- [ ] **Step 4: Wire state and shortcut focus**

In `TaskWorkspace`:

```tsx
const [isQuickAddExpanded, setIsQuickAddExpanded] = useState(false);
```

For the `n` shortcut:

```tsx
if (event.key.toLowerCase() === 'n') {
  setIsQuickAddExpanded(true);
  window.requestAnimationFrame(() => titleInputRef.current?.focus());
  return;
}
```

Pass both expansion props to `TaskQuickAdd`. Do not reset expansion state after task creation.

- [ ] **Step 5: Verify Task 2**

```bash
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "quick add|shortcut|creates a task"
npm test -- src/features/tasks/TaskWorkspace.test.tsx
```

Expected: focused tests and the complete workspace file PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/features/tasks/TaskWorkspace.tsx src/features/tasks/TaskQuickAdd.tsx src/features/tasks/taskUiText.ts src/features/tasks/TaskWorkspace.test.tsx
git commit -m "feat: add progressive quick capture"
```

---

