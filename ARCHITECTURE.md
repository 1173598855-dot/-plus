# 架构说明

本文档面向参与开发的人，说明代码如何组织、数据如何流动，以及扩展功能时应遵循的约定。用户功能清单见 `README.md`，视觉与产品方向见 `DESIGN.md` 和 `PRODUCT.md`，迭代历史见 `docs/optimization-roadmap.md`。

## 分层

代码分三层，依赖方向自上而下，下层不依赖上层：

- `src/features/tasks`：任务领域。包含任务模型、纯函数领域逻辑、界面文案、种子数据、备份导入导出，以及唯一的界面组件 `TaskWorkspace`。
- `src/lib`：可复用基础设施。与任务领域无关的通用工具：`storage`（localStorage 适配器）、`id`（唯一 id 生成）、`date`（日期格式化）。
- `src/app`：应用外壳。`App` 只负责组合，`main.tsx` 负责挂载和引入全局样式。

这样划分的目的是让领域逻辑与界面、存储解耦：领域层是纯 TypeScript，可以独立测试；存储层是一个可替换的适配器，将来换成 IndexedDB 或远端同步时，界面无需重写。

## 领域层：纯函数

`taskDomain.ts` 是核心，全部是纯函数——给定输入返回新值，不产生副作用，不读写外部状态：

- `createTask(draft, clock)`：从草稿创建任务，归一化字段并注入 id 和时间戳。时间与 id 通过 `clock` 参数传入，而非在函数内部调用 `Date.now()`，这样测试可以传入固定值。
- `updateTask(task, patch, now)`：应用局部修改，并处理完成/重开时 `completedAt` 的联动。
- `filterTasks` / `sortTasks` / `moveTask` / `summarizeTasks` / `groupTasksByStatus`：筛选、排序、拖拽重排、统计和按状态分组。
- `normalizeTasks`：为旧数据补齐 `sortOrder`、`estimateMinutes`、`energy` 等后加字段的默认值，保证向后兼容。

关键约定：**领域函数不接触 `Date`、`localStorage` 或 React**。时间和随机性都由调用方注入（见 `TaskClock`）。新增领域逻辑时请沿用这一约定，它是这些函数可测试的前提。

## 数据流

单向数据流，`TaskWorkspace` 是唯一持有任务状态的组件：

1. 初始化时从 `loadJson` 读取 localStorage，读不到或解析失败则回退到 `seedTasks`，再经 `normalizeTasks` 补齐字段。
2. 所有修改都通过 `setTasks` 走领域函数产生新数组，React 重新渲染。
3. 一个 `useEffect` 监听 `tasks` 变化，通过 `saveJson` 写回 localStorage；写失败时以非阻塞的状态提示告知用户，不会抛出中断界面。
4. 派生数据（`sortedTasks`、`filteredTasks`、`groups`、`summary` 等）全部用 `useMemo` 从 `tasks` 计算，不单独存 state，避免状态不同步。

## 界面文案

所有中文界面文案集中在 `taskUiText.ts`，组件不内联硬编码字符串。修改文案或将来做国际化时改这一个文件即可。注意：部分文案值被测试用例作为断言目标（如状态提示消息），改动前请确认对应测试。

## 存储与备份

- `lib/storage.ts`：`loadJson` / `saveJson` 封装 localStorage，读失败静默回退，写失败抛出由调用方处理。存储键为 `personal-task-manager.tasks.v1`，键名中的版本号为将来迁移预留。
- `features/tasks/taskBackup.ts`：JSON 导入导出。导出带 `version` 和 `exportedAt` 元信息；导入时用 `isTask` 做逐字段校验，非法数据抛出中文错误，合法数据经 `normalizeTasks` 补齐后返回。

## 测试约定

测试用 Vitest + Testing Library，测试文件与源码同目录（`*.test.ts` / `*.test.tsx`）。

- 领域逻辑测试先行：新增或修改 `taskDomain`、`taskBackup`、`storage` 的行为时，先写失败测试再实现。
- 领域测试通过注入固定的 `clock` 保证结果可预测。
- `TaskWorkspace.test.tsx` 覆盖界面交互（创建、筛选、批量操作、拖拽、导入导出、快捷键等），依赖 `taskUiText.ts` 里的可访问名称定位元素。
- `App.css.test.ts` 通过解析 CSS 文本校验列表网格列对齐等布局约束。

## 新增功能的落点

- 新增任务字段：改 `taskTypes.ts` 的接口 → 在 `createTask`/`updateTask`/`normalizeTasks` 里处理归一化和默认值 → 在 `taskBackup.ts` 的 `isTask` 里加校验 → 在 `TaskWorkspace` 的快速新增、详情、卡片、列表处展示/编辑 → 补测试。
- 新增视图或筛选：领域侧加对应的纯函数或筛选分支，界面侧在 `TaskWorkspace` 接线，文案进 `taskUiText.ts`。
- 替换存储后端：实现符合 `StorageLike` 接口的适配器替换 `lib/storage.ts` 的实现，界面层无需改动。

## 命令

```bash
npm install      # 安装依赖
npm run dev      # 启动本地开发服务器
npm test         # 运行 Vitest
npm run build    # tsc --noEmit 类型检查后再 vite build
```
