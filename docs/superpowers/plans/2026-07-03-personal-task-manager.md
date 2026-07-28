# Personal Task Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable local-first personal task manager with tested task logic, browser persistence, and a polished React workspace UI.

**Architecture:** Domain logic lives in pure TypeScript modules under `src/features/tasks` and is covered by Vitest. React components compose those modules into a single workspace and persist state through a small storage helper under `src/lib`.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, localStorage, CSS modules via plain CSS.

## Global Constraints

- Keep the first version local-first and browser-only.
- Do not add accounts, cloud sync, collaboration, or external integrations.
- Keep task domain functions pure and easy to test.
- Persist data through a replaceable storage adapter.
- The app must pass `npm test` and `npm run build`.

---

## File Structure

- Create `package.json`: scripts and dependencies for Vite, React, TypeScript, and Vitest.
- Create `index.html`, `src/main.tsx`, `src/app/App.tsx`, `src/app/App.css`: app entry and shell.
- Create `src/features/tasks/taskTypes.ts`: shared task and filter types.
- Create `src/features/tasks/taskDomain.ts`: pure task operations, selectors, summaries, grouping.
- Create `src/features/tasks/seedTasks.ts`: initial example tasks.
- Create `src/features/tasks/TaskWorkspace.tsx`: primary task UI.
- Create `src/lib/storage.ts`: localStorage adapter.
- Create `src/lib/date.ts`: date helpers.
- Create `src/lib/id.ts`: ID helper.
- Create tests under `src/features/tasks/taskDomain.test.ts` and `src/lib/storage.test.ts`.

## Task 1: Project Scaffold And Domain Model

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/features/tasks/taskTypes.ts`
- Test: `src/features/tasks/taskDomain.test.ts`

**Interfaces:**
- Produces: `Task`, `TaskDraft`, `TaskPatch`, `TaskFilters`, `TaskStatus`, `TaskPriority` types.
- Produces: placeholder-free test expectations for domain functions used in Task 2.

- [x] **Step 1: Write failing tests for task creation behavior**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Add scaffold and shared types**
- [x] **Step 4: Run test again**

## Task 2: Task Domain Operations

**Files:**
- Create: `src/features/tasks/taskDomain.ts`
- Modify: `src/features/tasks/taskDomain.test.ts`

**Interfaces:**
- Consumes: `Task`, `TaskDraft`, `TaskPatch`, `TaskFilters`.
- Produces: `createTask`, `updateTask`, `deleteTask`, `filterTasks`, `summarizeTasks`, `groupTasksByStatus`.

- [x] **Step 1: Write failing tests for update, completion, filtering, grouping, and summary**
- [x] **Step 2: Run tests to verify failures**
- [x] **Step 3: Implement minimal pure functions**
- [x] **Step 4: Run tests to verify pass**

## Task 3: Storage Adapter

**Files:**
- Create: `src/lib/storage.ts`
- Test: `src/lib/storage.test.ts`

**Interfaces:**
- Produces: `loadJson<T>(key: string, fallback: T, storage?: StorageLike): T`
- Produces: `saveJson<T>(key: string, value: T, storage?: StorageLike): void`
- Produces: `StorageLike` interface.

- [x] **Step 1: Write failing storage tests**
- [x] **Step 2: Run tests to verify failures**
- [x] **Step 3: Implement adapter**
- [x] **Step 4: Run tests to verify pass**

## Task 4: React Workspace UI

**Files:**
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/App.css`
- Create: `src/features/tasks/TaskWorkspace.tsx`
- Create: `src/features/tasks/seedTasks.ts`
- Create: `src/lib/date.ts`
- Create: `src/lib/id.ts`

**Interfaces:**
- Consumes: domain functions and storage helpers.
- Produces: a first-screen task workspace with create, edit, complete, delete, filters, list view, board summary, and persistence.

- [x] **Step 1: Create app entry and seed data**
- [x] **Step 2: Build workspace component**
- [x] **Step 3: Add responsive CSS**
- [x] **Step 4: Build app**

## Task 5: Verification And Run

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: basic usage instructions.

- [x] **Step 1: Add README**
- [x] **Step 2: Run full verification**
- [x] **Step 3: Start local dev server**
