### Task 3: Compact Work Bands And Mobile Filters

**Files:**
- Modify: `src/features/tasks/TaskWorkspace.tsx`
- Modify: `src/features/tasks/TaskToolbar.tsx`
- Modify: `src/features/tasks/taskUiText.ts`
- Modify: `src/features/tasks/TaskWorkspace.test.tsx`

**Interfaces:**
- `TaskWorkspace` produces `isMobileFiltersExpanded: boolean`.
- `TaskToolbarProps` adds `isMobileFiltersExpanded`, `activeFilterCount`, and `onMobileFiltersExpandedChange`.
- `.workband-primary` and `.workband-filters` become the stable CSS hooks; retain `.filter-strip` on the filter controls container for existing tests.

- [ ] **Step 1: Add failing mobile filter tests**

Add:

```tsx
  it('toggles the mobile filter disclosure and reports active filter count', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);
    const toggle = screen.getByRole('button', { name: '展开筛选（0）' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByLabelText('任务筛选')).not.toHaveClass('mobile-expanded');

    await user.click(toggle);
    expect(screen.getByLabelText('任务筛选')).toHaveClass('mobile-expanded');

    await user.selectOptions(screen.getByLabelText('按优先级筛选'), 'high');
    expect(screen.getByRole('button', { name: '收起筛选（1）' })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run and verify RED**

```bash
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "mobile filter disclosure"
```

Expected: FAIL because the disclosure button and `任务筛选` region do not exist.

- [ ] **Step 3: Add exact toolbar labels**

Add to `toolbarLabels`:

```ts
filters: '任务筛选',
expandFilters: '展开筛选',
collapseFilters: '收起筛选',
```

- [ ] **Step 4: Implement the two work bands**

Wrap the existing primary toolbar controls in `<header className="workband-primary">`. Add a mobile disclosure button:

```tsx
<button
  className="mobile-filter-toggle"
  type="button"
  aria-expanded={isMobileFiltersExpanded}
  aria-controls="task-filter-strip"
  aria-label={`${isMobileFiltersExpanded ? toolbarLabels.collapseFilters : toolbarLabels.expandFilters}（${activeFilterCount}）`}
  onClick={() => onMobileFiltersExpandedChange(!isMobileFiltersExpanded)}
>
  <ListFilter size={16} />
  <span>{toolbarLabels.filters}</span>
  {activeFilterCount > 0 && <strong>{activeFilterCount}</strong>}
</button>
```

Change the filter container to:

```tsx
<div id="task-filter-strip" className={`filter-strip workband-filters ${isMobileFiltersExpanded ? 'mobile-expanded' : ''}`} aria-label={toolbarLabels.filters}>
```

Keep all existing select labels and callbacks. Ensure the date select renders only one `all` option by filtering `dueFilterLabels` entries or removing the separate duplicate option.

- [ ] **Step 5: Wire state and filter count**

In `TaskWorkspace`:

```tsx
const [isMobileFiltersExpanded, setIsMobileFiltersExpanded] = useState(false);
```

Pass `activeFilterCount={activeFilterLabels.length}` and both expansion props to `TaskToolbar`.

- [ ] **Step 6: Verify Task 3**

```bash
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "filter|toolbar|mobile filter disclosure"
npm test -- src/features/tasks/TaskWorkspace.test.tsx
```

Expected: all filter/toolbar tests and the full workspace file PASS.

- [ ] **Step 7: Commit Task 3**

```bash
git add src/features/tasks/TaskWorkspace.tsx src/features/tasks/TaskToolbar.tsx src/features/tasks/taskUiText.ts src/features/tasks/TaskWorkspace.test.tsx
git commit -m "feat: add compact filter work bands"
```

---

