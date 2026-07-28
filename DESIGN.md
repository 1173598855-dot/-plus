# Design

## Identity

个人任务管理库采用 restrained product UI。设计服务于任务整理，不追求品牌化展示。整体感觉应像一张安静、稳定、可反复使用的工作台。

## Color

Use semantic tokens in `src/app/App.css`.

- `--surface-base`: app background, neutral and non-decorative.
- `--surface-panel`: sidebar, toolbar, detail panel, column surfaces.
- `--surface-raised`: task cards and rows.
- `--ink`: primary readable text.
- `--muted`: secondary text.
- `--line`: borders and separators.
- `--accent`: primary action, selected view, keyboard focus.
- `--danger`: destructive action.
- `--warning`: urgent/high priority emphasis.

Color should remain restrained. Accent color is for current selection, primary action, focus, and task state emphasis only.

## Typography

Use the existing system sans stack. Product labels, form controls, task titles, and data should use the same family with different weight and size. Avoid decorative display fonts.

## Layout

The primary shell has a left capture/summary rail and a main workspace with toolbar, content view, and detail panel. Desktop should prioritize scanning and comparison. Tablet collapses to one column. Mobile keeps controls reachable and turns dense rows into simplified cards.

## Components

- Primary button: solid accent, clear disabled state.
- Icon buttons: consistent lucide outline icons, minimum usable hit area.
- Inputs/selects: same border, radius, focus ring, and background.
- Task cards/rows: subtle border, selected state with accent border, no heavy shadow.
- View switch: segmented control with clear selected state.
- Empty state: plain instruction area, not decorative.

## Motion

Motion is minimal and state-driven: hover, active press, focus, selected state. Use short transitions only. Respect `prefers-reduced-motion` by removing transitions.

## Responsive Rules

- No text overflow inside buttons or cards.
- Touch-oriented controls should be at least 40px high, with 44px where practical.
- Avoid horizontal scroll on mobile.
- Keep detail editing below the main view on tablet/mobile.
