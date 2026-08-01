# GitHub 发布整理设计

## 目标

将个人任务管理库整理为适合公开 GitHub 仓库的结构：访问者能快速找到应用源码、使用说明、架构文档和验证方式；开发过程归档继续保留在本机，但不再进入公开仓库。

## 范围

- 保留现有 `src/`、`public/`、`docs/` 和根目录产品文档的布局。
- 将根目录 `.superpowers/` 从 Git 索引移除，并加入 `.gitignore`；文件仍保留在本机，供后续开发追溯。
- 新增 GitHub Actions 工作流，在对 `main` 的推送和拉取请求中运行 `npm ci`、`npm test`、`npm run build`。
- 在 README 中补充简明的项目结构与文档入口，链接产品、架构、设计和路线图文档。

## 公开仓库边界

GitHub 仓库保留应用源码、公开产品文档、设计/架构说明、依赖锁文件、测试和发布所需配置。`.superpowers/` 中的任务简报、审查补丁、过程报告和进度快照属于本地开发档案，不作为公开仓库内容。

现有 `docs/superpowers/` 设计与实施计划继续保留，因为它们描述已交付的产品决策和可复现的工程演进；本次不移动或删除它们。

## CI 设计

工作流文件为 `.github/workflows/ci.yml`。它使用受支持的 Node LTS 运行环境，先通过 `actions/checkout` 和 `actions/setup-node` 取得锁定依赖，再依次执行：

```text
npm ci
npm test
npm run build
```

工作流不部署应用、不发布 npm 包、不使用密钥，也不修改版本号。任何步骤失败都会使 GitHub 检查失败。

## README 设计

README 保持现有的产品说明、功能、开发、测试、构建和边界内容。新增两段紧凑导航：

- 项目结构：说明 `src/`、`public/`、`docs/` 与根目录配置的职责。
- 项目文档：链接 `PRODUCT.md`、`ARCHITECTURE.md`、`DESIGN.md`、路线图和第三方资源清单。

不加入徽章、营销内容或重复的实现细节。

## 非目标

- 不改动 React 组件、任务领域规则、存储、测试语义或视觉样式。
- 不重排 `src/` 或 `docs/` 的现有目录。
- 不新增许可证、贡献规范、议题模板或发布流程；这些需要单独的产品/开源治理决策。
- 不删除本机 `.superpowers/` 档案，也不重写 Git 历史。

## 验收与推送

整理完成后，Git 追踪列表中不再包含 `.superpowers/`，本机归档仍存在且被忽略；README 链接有效；CI 工作流包含锁定安装、测试与构建命令。执行 `npm test`、`npm run build` 和 `git diff --check` 后，将完成分支快进到 `main` 并推送到用户提供的 GitHub 远端。不会强推或覆盖远端既有历史。
