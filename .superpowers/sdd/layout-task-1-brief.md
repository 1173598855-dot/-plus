### Task 1: Local Static Assets And Contextual Empty States

**Files:**
- Create: `src/assets/empty-states/next-task.svg`
- Create: `src/assets/empty-states/search-results.svg`
- Create: `src/assets/empty-states/the-void.svg`
- Create: `src/features/tasks/TaskEmptyState.tsx`
- Create: `public/favicon.svg`
- Create: `docs/third-party-assets.md`
- Modify: `src/features/tasks/TaskViews.tsx`
- Modify: `src/features/tasks/TaskWorkspace.test.tsx`
- Modify: `index.html`

**Interfaces:**
- Produces: `TaskEmptyState({ variant, message, showClearFilters, onClearFilters })` where `variant` is `'today' | 'completed' | 'filtered' | 'board'`.
- Consumes: `emptyMessages`, the three local SVG imports, and the existing clear-filter callback.

- [ ] **Step 1: Add failing empty-state artwork tests**

Add near the existing empty-state tests in `TaskWorkspace.test.tsx`:

```tsx
  it('shows contextual local artwork for completed and filtered empty states', async () => {
    const user = userEvent.setup();
    render(<TaskWorkspace />);

    await user.click(screen.getByRole('button', { name: '完成' }));
    expect(screen.getByTestId('empty-artwork-completed')).toHaveAttribute('src', expect.stringContaining('the-void'));
    expect(screen.getByTestId('empty-artwork-completed')).toHaveAttribute('alt', '');

    await user.click(screen.getByRole('button', { name: '看板' }));
    await user.type(screen.getByLabelText('搜索任务'), '不存在的任务');
    expect(screen.getByTestId('empty-artwork-filtered')).toHaveAttribute('src', expect.stringContaining('search-results'));
  });
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "contextual local artwork"
```

Expected: FAIL because `empty-artwork-completed` does not exist.

- [ ] **Step 3: Download and mechanically recolor the exact assets**

Create `src/assets/empty-states`, then download:

```powershell
Invoke-WebRequest 'https://cdn.undraw.co/illustration/next-task_jtbr.svg' -OutFile 'src/assets/empty-states/next-task.svg'
Invoke-WebRequest 'https://cdn.undraw.co/illustration/search-results_reis.svg' -OutFile 'src/assets/empty-states/search-results.svg'
Invoke-WebRequest 'https://cdn.undraw.co/illustration/the-void_i26b.svg' -OutFile 'src/assets/empty-states/the-void.svg'
```

Mechanically replace `#6c63ff` with `#155e63` and `#ed9da0` with `#526a88` in all three SVG files. Do not alter path geometry or view boxes.

- [ ] **Step 4: Implement the empty-state component**

Create `TaskEmptyState.tsx`:

```tsx
import nextTaskArtwork from '../../assets/empty-states/next-task.svg';
import searchResultsArtwork from '../../assets/empty-states/search-results.svg';
import theVoidArtwork from '../../assets/empty-states/the-void.svg';

export type EmptyStateVariant = 'board' | 'today' | 'completed' | 'filtered';

const artworkByVariant: Partial<Record<EmptyStateVariant, string>> = {
  today: nextTaskArtwork,
  completed: theVoidArtwork,
  filtered: searchResultsArtwork,
};

interface TaskEmptyStateProps {
  variant: EmptyStateVariant;
  message: string;
  showClearFilters?: boolean;
  onClearFilters: () => void;
  className?: string;
}

export function TaskEmptyState({ variant, message, showClearFilters = false, onClearFilters, className = '' }: TaskEmptyStateProps) {
  const artwork = artworkByVariant[variant];

  return (
    <div className={`empty-state ${className}`.trim()}>
      {artwork && <img className="empty-artwork" src={artwork} alt="" aria-hidden="true" data-testid={`empty-artwork-${variant}`} />}
      <span>{message}</span>
      {showClearFilters && (
        <button className="clear-filter" type="button" onClick={onClearFilters}>清空筛选</button>
      )}
    </div>
  );
}
```

Replace the duplicated board/list empty-state JSX in `TaskViews.tsx` with `TaskEmptyState`. Use `filtered` whenever `hasActiveFilters`, otherwise use `today`, `completed`, or `board` according to the active view/label.

- [ ] **Step 5: Add favicon and asset ledger**

Create `public/favicon.svg` as a square `PT` brand mark using `#155e63` and no gradients. Add this to `index.html`:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

Create `docs/third-party-assets.md` listing the three exact CDN URLs above, download date `2026-07-26`, unDraw license URL `https://undraw.co/license`, local filenames, and the two mechanical color substitutions.

- [ ] **Step 6: Verify Task 1**

Run:

```bash
npm test -- src/features/tasks/TaskWorkspace.test.tsx -t "empty|contextual local artwork"
npm run build
```

Expected: all matching tests PASS; Vite resolves all local SVG imports and builds successfully.

- [ ] **Step 7: Commit Task 1**

```bash
git add index.html public/favicon.svg src/assets/empty-states src/features/tasks/TaskEmptyState.tsx src/features/tasks/TaskViews.tsx src/features/tasks/TaskWorkspace.test.tsx docs/third-party-assets.md
git commit -m "feat: add local task empty-state artwork"
```

---

