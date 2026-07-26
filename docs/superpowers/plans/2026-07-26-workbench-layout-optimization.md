# Workbench Layout Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the task manager shell as a compact, progressively disclosed workbench with a full-width task canvas, mobile-aware filters, an overlay detail drawer, and locally bundled empty-state artwork.

**Architecture:** `TaskWorkspace` remains the single owner of task and UI orchestration state. Existing presentational components receive explicit expansion/drawer props and callbacks; task domain, backup, storage, and drag rules remain unchanged. CSS provides the two-band desktop layout and responsive mobile presentation without adding a framework.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, plain CSS, lucide-react, locally bundled unDraw SVG assets, Playwright CLI.

## Global Constraints

- Do not add npm dependencies, a component library, a CSS framework, an animation framework, or remote fonts.
- Preserve task model, backup JSON format, storage key, domain rules, import/export behavior, drag/reorder behavior, bulk actions, and local persistence.
- Keep user-facing copy in Chinese and functional icons in the existing Lucide family.
- Keep card radii at `8px` or less and use shadow only for the overlay detail drawer.
- Do not use gradients, glassmorphism, decorative cards, marketing composition, or runtime external asset requests.
- Bundle all illustrations locally and record source URLs and license.
- Respect `prefers-reduced-motion` and WCAG AA focus/contrast behavior.
- `npm test` and `npm run build` must pass before completion.

---

## File Structure

- Modify `src/features/tasks/TaskWorkspace.tsx`: owns quick-add expansion, mobile filter expansion, and overlay detail visibility.
- Modify `src/features/tasks/TaskQuickAdd.tsx`: renders the compact capture row and expandable detailed fields.
- Modify `src/features/tasks/TaskToolbar.tsx`: renders the two work bands and mobile filter disclosure.
- Modify `src/features/tasks/TaskViews.tsx`: opens details from board cards and selects context-specific empty-state artwork.
- Modify `src/features/tasks/TaskDetailPanel.tsx`: preserves the editor while adopting drawer-friendly semantics.
- Modify `src/features/tasks/taskUiText.ts`: owns new Chinese disclosure labels.
- Create `src/features/tasks/TaskEmptyState.tsx`: maps empty-state variants to locally bundled illustrations.
- Create `src/assets/empty-states/next-task.svg`, `search-results.svg`, `the-void.svg`: local unDraw illustrations.
- Create `public/favicon.svg`: local product favicon.
- Modify `src/app/App.css`: complete workbench layout, compact density, drawer, and responsive rules.
- Modify `src/features/tasks/TaskWorkspace.test.tsx`: behavior and DOM contract regressions.
- Modify `src/app/App.css.test.ts`: structural CSS contracts.
- Create `docs/third-party-assets.md`: source and license ledger.
- Modify `README.md`: note progressive capture, mobile filters, overlay details, and local illustrations.

---

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

### Task 5: Responsive Workbench Styling And Final Verification

**Files:**
- Modify: `src/app/App.css`
- Modify: `src/app/App.css.test.ts`
- Modify: `README.md`
- Test: all Vitest files, TypeScript/Vite build, Playwright browser checks

**Interfaces:**
- Consumes stable hooks created earlier: `.quick-capture-row`, `.quick-add-fields`, `.workband-primary`, `.workband-filters`, `.mobile-filter-toggle`, `.content-grid`, `.detail-layer`, `.detail-scrim`, `.empty-artwork`.
- Produces desktop layout at `>1180px`, compact intermediate layout at `721px–1180px`, and mobile layout at `<=720px`.

- [ ] **Step 1: Add failing CSS contract tests**

Add to `App.css.test.ts`:

```ts
  it('reserves a compact rail and full-width task canvas', () => {
    expect(getGridTemplateColumns('.workspace')).toBe('280px minmax(0, 1fr)');
    expect(getGridTemplateColumns('.metric-grid')).toBe('repeat(4, minmax(0, 1fr))');
    expect(getGridTemplateColumns('.content-grid')).toBe('minmax(0, 1fr)');
  });

  it('keeps filter overflow inside the work band and details in an overlay layer', () => {
    expect(getRuleBody('.workband-filters')).toContain('overflow-x: auto');
    expect(getRuleBody('.detail-layer')).toContain('position: fixed');
    expect(getRuleBody('.detail')).toContain('width: min(360px, calc(100vw - 32px))');
  });

  it('collapses optional controls on mobile without horizontal page overflow', () => {
    const mobileBody = getMediaBody('(max-width: 720px)');
    expect(getRuleBody('body')).toContain('overflow-x: hidden');
    expect(getRuleBodyFromSource(mobileBody, '.filter-strip:not(.mobile-expanded)')).toContain('display: none');
    expect(getRuleBodyFromSource(mobileBody, '.detail')).toContain('width: 100%');
  });
```

- [ ] **Step 2: Run and verify RED**

```bash
npm test -- src/app/App.css.test.ts
```

Expected: FAIL because the compact rail, one-column canvas, work bands, drawer layer, and mobile disclosure CSS are not implemented.

- [ ] **Step 3: Implement the exact token and layout system**

Update root tokens to the values in the design spec, including `--support: #526a88`. Apply these structural rules:

```css
body { overflow-x: hidden; }
.workspace { grid-template-columns: 280px minmax(0, 1fr); min-height: 100dvh; }
.rail { position: sticky; top: 0; max-height: 100dvh; overflow-y: auto; padding: 18px; }
.metric-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.quick-capture-row { display: grid; grid-template-columns: minmax(0, 1fr) 42px; gap: 8px; }
.quick-add-fields { display: grid; gap: 8px; }
.main-panel { padding: 18px 20px 24px; }
.workband-primary { display: grid; grid-template-columns: auto minmax(240px, 1fr) minmax(220px, 320px) 40px; }
.workband-filters { display: flex; overflow-x: auto; scrollbar-width: thin; }
.workband-filters select { width: auto; min-width: 132px; }
.mobile-filter-toggle { display: none; }
.content-grid { grid-template-columns: minmax(0, 1fr); }
.board { grid-template-columns: repeat(5, minmax(238px, 1fr)); }
.column { min-height: calc(100dvh - 178px); }
.detail-layer { position: fixed; inset: 0; z-index: 30; }
.detail-scrim { position: absolute; inset: 0; background: rgba(24, 32, 29, 0.18); }
.detail { position: absolute; inset: 16px 16px 16px auto; width: min(360px, calc(100vw - 32px)); overflow-y: auto; box-shadow: 0 18px 48px rgba(24, 32, 29, 0.18); }
.empty-artwork { width: min(180px, 55%); max-height: 128px; object-fit: contain; }
```

Refine typography, borders, button density, task-card spacing, selected states, and support-color usage consistently with the spec. Do not add decorative backgrounds or oversized text.

- [ ] **Step 4: Implement intermediate and mobile rules**

At `max-width: 1180px`, keep the side rail at `250px` rather than stacking it; allow primary work band rows to wrap and keep filters internally scrollable.

At `max-width: 900px`, stack the rail above the workspace and remove sticky rail positioning.

At `max-width: 720px`:

```css
.rail, .main-panel { padding: 12px; }
.metric-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.workband-primary { grid-template-columns: 1fr 40px; }
.view-switch, .search-box, .workspace-status { grid-column: 1 / -1; }
.mobile-filter-toggle { display: inline-flex; }
.filter-strip:not(.mobile-expanded) { display: none; }
.workband-filters.mobile-expanded { display: grid; grid-template-columns: 1fr; overflow: visible; }
.board { grid-template-columns: 1fr; overflow: visible; }
.column { min-height: auto; }
.detail-layer { background: var(--surface-panel); }
.detail-scrim { display: none; }
.detail { inset: 0; width: 100%; min-height: 100dvh; border: 0; border-radius: 0; box-shadow: none; }
```

Make sure all buttons and text remain inside their containers.

- [ ] **Step 5: Run automated verification**

```bash
npm test
npm run build
```

Expected: every Vitest file passes; TypeScript and Vite production build complete without warnings from application code.

- [ ] **Step 6: Run Playwright visual verification**

Start or reuse the Vite dev server. Using a persistent Playwright CLI session, for each viewport clear local storage, reload, capture a snapshot and full-page screenshot:

```text
1440 × 900 -> output/playwright/optimized-desktop.png
1024 × 768 -> output/playwright/optimized-tablet.png
390 × 844  -> output/playwright/optimized-mobile.png
```

Verify:

- page `scrollWidth <= innerWidth` at every viewport;
- desktop filter controls remain in one internally scrollable work band;
- quick-add details are initially absent and expand on command;
- board occupies the remaining canvas without a permanent detail column;
- clicking a board task opens a visible nonblank drawer; closing it restores the same scroll position;
- mobile filter controls are hidden until the disclosure button is clicked;
- screenshots contain no text overlap, clipped buttons, blank illustration boxes, or broken images;
- `playwright-cli console error` returns no errors, including favicon 404.

- [ ] **Step 7: Update README**

Add to the feature list:

```md
- 渐进式快速新增：标题和添加动作常驻，完整任务字段按需展开
- 桌面紧凑筛选工作带与移动端筛选展开面板
- 覆盖式任务详情抽屉，不再持续挤压看板和列表空间
- 本地打包的空状态插画，不依赖运行时外部资源
```

Update `当前边界` to state that UI disclosure state is ephemeral and is not included in task backup data.

- [ ] **Step 8: Final self-review and commit**

Inspect scoped changes for accidental task-domain or storage edits. Confirm downloaded SVGs contain no scripts, external links, embedded raster data, or event handlers.

```bash
git add src/app/App.css src/app/App.css.test.ts README.md
git commit -m "style: optimize responsive task workbench"
```

---

## Self-Review

Spec coverage:

- Progressive capture, two work bands, mobile filter disclosure, full-width task canvas, overlay details, local empty-state assets, favicon, source ledger, visual tokens, reduced motion, responsive layouts, automated tests, and three Playwright viewports all have explicit tasks.
- Domain, backup, storage, drag, bulk, and import/export behavior are preserved and never moved into presentational components.

Placeholder scan:

- No `TBD`, `TODO`, “implement later”, generic error-handling step, or undefined method remains.
- Every production behavior change has a named failing test and an exact focused command before implementation.

Type consistency:

- Quick-add props use `isExpanded` / `onExpandedChange` in Task 2.
- Toolbar props use `isMobileFiltersExpanded`, `activeFilterCount`, and `onMobileFiltersExpandedChange` in Task 3.
- Empty-state variants are defined once in `TaskEmptyState.tsx` and consumed by `TaskViews`.
- `showDetail` remains the existing workspace-owned boolean and changes only its initial value and presentation semantics.
