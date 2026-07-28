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
