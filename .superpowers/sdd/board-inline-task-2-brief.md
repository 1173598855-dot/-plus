# Task 2: Responsive Layout And Regression Closure

Plan: `docs/superpowers/plans/2026-07-28-board-inline-quick-add.md`
Spec: `docs/superpowers/specs/2026-07-28-board-inline-quick-add-design.md`

## Scope

Complete only CSS, CSS regression tests, and user documentation after Task 1 behavior is approved. Do not change task behavior or component interfaces.

## Files

- Modify `src/app/App.css.test.ts`
- Modify `src/app/App.css`
- Modify `README.md`
- Modify `docs/optimization-roadmap.md`
- Write report `.superpowers/sdd/board-inline-task-2-report.md`

## Required CSS Contract

Preserve these exact validated declarations:

```css
.workspace { min-height: 100dvh; }
.rail { max-height: 100dvh; }
.column { min-height: calc(100dvh - 178px); }
```

Inside `@media (max-width: 720px)`, preserve:

```css
.detail { min-height: 100dvh; }
```

Replace the interrupted `.column-add` visual exploration with a quiet unframed row:

```css
.column-add {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40px;
  gap: 6px;
  margin-top: var(--space-3);
}

.column-add input {
  min-height: 40px;
  padding: 7px 10px;
  font-size: 13px;
}

.column-add-btn {
  width: 40px;
  min-width: 40px;
  height: 40px;
  color: var(--accent);
}
```

Do not put a border/background around `.column-add`; the input and button are already framed controls. Keep the existing disabled treatment. Restore `.main-panel` padding to the validated `18px 20px 24px`. Remove trailing whitespace and extra EOF blank lines.

## TDD Evidence Required

Before editing CSS, add focused `App.css.test.ts` tests that fail against the interrupted stylesheet and assert:

1. The exact four full-height declarations above.
2. `.column-add` is a two-track grid with `margin-top: var(--space-3)`.
3. `.column-add input` and `.column-add-btn` each use `40px` minimum/height values.
4. The mobile body does not override the input below `40px`.

Run the focused tests and record expected RED output. Then make the minimum CSS changes and run the focused tests GREEN.

## Documentation

- Add a README feature bullet stating that unfiltered board columns support title-only Enter/Plus quick capture.
- Add “第十二批：看板列内快速新建” to `docs/optimization-roadmap.md`, mark it complete, and mention correct-status creation, persistence, filter hiding, IME-safe Enter, mobile target size, and regression tests.
- Preserve the existing Chinese content and UTF-8 encoding.

## Verification

Run:

```powershell
npm test -- src/app/App.css.test.ts
npm test
npm run build
git diff --check
```

Write `.superpowers/sdd/board-inline-task-2-report.md` with exact RED/GREEN evidence, full verification counts, self-review, and concerns. Return only status, commit hash, one-line test/build summary, and concerns. Commit only Task 2 source/docs/report files with message `style: finish board column quick capture`.
