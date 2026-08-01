# GitHub 发布整理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 将项目整理为可公开发布的 GitHub 仓库，同时保留本机开发归档并为 main 提供持续集成检查。

**Architecture:** 应用源码和公开文档维持现有布局。根目录 .superpowers/ 只从 Git 索引移除并由 .gitignore 忽略，因此归档文件继续存在于本机；GitHub Actions 只运行锁定安装、测试和构建，不部署或发布任何制品。最后使用仅快进合并将已验证分支带入 main，并仅在远端历史兼容时推送。

**Tech Stack:** Git, GitHub Actions, Node.js 22, npm, Vitest, TypeScript, Vite, PowerShell.

## Global Constraints

- 保留现有 src/、public/、docs/ 和根目录产品文档布局，不改动应用行为。
- .superpowers/ 必须保留在本机，但不得继续出现在 git ls-files 输出中。
- CI 只能运行 npm ci、npm test 和 npm run build；不得部署、发布、读取密钥或修改版本号。
- 不新增许可证、贡献规范、议题模板或发布流程。
- main 只能通过 git merge --ff-only 前进；绝不使用强推，也不覆盖不兼容的远端历史。
- 每个任务结束前运行相应验证；发布前必须运行完整测试、构建和 git diff --check。

---

### Task 1: 将本地开发归档移出公开 Git 索引

**Files:**
- Modify: .gitignore
- Modify: .gitattributes
- Remove from Git index, preserve on disk: .superpowers/

**Interfaces:**
- Consumes: 根目录 .superpowers/ 现有开发归档和 Git 索引。
- Produces: .superpowers/ 的本地忽略规则；公开提交中不再包含该目录。

- [ ] **Step 1: 记录当前归档追踪状态的失败基线**

运行：

~~~powershell
$tracked = git ls-files -- .superpowers
if ([string]::IsNullOrWhiteSpace($tracked)) { throw '.superpowers is unexpectedly not tracked.' }
$tracked | Measure-Object -Line
git check-ignore -v -- .superpowers/sdd/progress.md
if ($LASTEXITCODE -eq 0) { throw '.superpowers is unexpectedly ignored before cleanup.' }
~~~

Expected: 追踪列表非空，且 git check-ignore 没有匹配并返回非零，证明归档当前会公开进入仓库。

- [ ] **Step 2: 从索引移除归档但保留本机文件**

运行：

~~~powershell
git rm -r --cached -- .superpowers
~~~

该命令只能移除 Git 索引条目，不能使用不带 --cached 的 git rm，以避免删除本机归档。

- [ ] **Step 3: 添加忽略规则并移除失效的归档空白豁免**

将以下规则加入 .gitignore 的本地开发工具区域：

~~~gitignore
# Local development plans, reviews, and handoff archives
.superpowers/
~~~

从 .gitattributes 移除以下两行，因为公开仓库不再跟踪该目录中的补丁归档：

~~~gitattributes
# Review patch archives preserve the whitespace of the recorded historical diff.
.superpowers/sdd/*.diff -whitespace
~~~

- [ ] **Step 4: 验证归档仍在本机且不再被 Git 追踪**

运行：

~~~powershell
if (-not (Test-Path -LiteralPath '.superpowers/sdd/progress.md')) { throw 'Local archive was deleted.' }
$tracked = git ls-files -- .superpowers
if (-not [string]::IsNullOrWhiteSpace($tracked)) { throw '.superpowers is still tracked.' }
$ignored = git check-ignore -v -- .superpowers/sdd/progress.md
if ($LASTEXITCODE -ne 0 -or $ignored -notmatch '^\.gitignore') { throw '.superpowers is not ignored by .gitignore.' }
git diff --check
~~~

Expected: PowerShell exits 0, the local archive exists, tracked output is empty, and .gitignore reports the matching ignore rule.

- [ ] **Step 5: Commit the archive boundary**

~~~powershell
git add .gitignore .gitattributes
git add -u -- .superpowers
git commit -m "chore: keep development archives local"
~~~

Expected: the commit removes only .superpowers/ index entries and updates the two repository-hygiene files.

### Task 2: 添加公开仓库入口与持续集成

**Files:**
- Create: .github/workflows/ci.yml
- Modify: README.md

**Interfaces:**
- Consumes: package-lock.json, npm scripts test and build, and the public root documentation files.
- Produces: GitHub Actions CI workflow and README navigation to public project documentation.

- [ ] **Step 1: 记录缺少公开入口的失败基线**

运行：

~~~powershell
if (Test-Path -LiteralPath '.github/workflows/ci.yml') { throw 'CI workflow unexpectedly exists.' }
rg -n '^## 项目结构$|^## 项目文档$' README.md
if ($LASTEXITCODE -eq 0) { throw 'README navigation sections unexpectedly exist.' }
~~~

Expected: two checks show that public CI and README navigation do not yet exist.

- [ ] **Step 2: 创建最小只读 CI 工作流**

创建 .github/workflows/ci.yml：

~~~yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
~~~

- [ ] **Step 3: 在 README 添加结构与文档导航**

在开头产品介绍之后、功能标题之前插入：

~~~markdown
## 项目结构

- src/：React 应用、任务领域逻辑和测试。
- public/：浏览器静态资源。
- docs/：产品路线图、设计规范和第三方资源记录。
- 根目录：安装、构建和 TypeScript/Vite 配置。

## 项目文档

- [产品定位](PRODUCT.md)
- [架构说明](ARCHITECTURE.md)
- [设计规范](DESIGN.md)
- [优化路线图](docs/optimization-roadmap.md)
- [第三方资源](docs/third-party-assets.md)
~~~

- [ ] **Step 4: 静态验证 CI 与 README 入口**

运行：

~~~powershell
$workflow = Get-Content -LiteralPath '.github/workflows/ci.yml' -Raw
foreach ($expected in @('name: CI', 'branches: [main]', 'contents: read', 'node-version: 22', 'cache: npm', 'npm ci', 'npm test', 'npm run build')) {
  if ($workflow -notmatch [regex]::Escape($expected)) { throw "CI is missing: $expected" }
}
foreach ($path in @('PRODUCT.md', 'ARCHITECTURE.md', 'DESIGN.md', 'docs/optimization-roadmap.md', 'docs/third-party-assets.md')) {
  if (-not (Test-Path -LiteralPath $path)) { throw "README target is missing: $path" }
}
rg -n '^## 项目结构$|^## 项目文档$' README.md
if ($LASTEXITCODE -ne 0) { throw 'README navigation headings are missing.' }
git diff --check
~~~

Expected: all assertions pass, both README headings are found, and the whitespace check is clean.

- [ ] **Step 5: Run application verification and commit public repository entrypoints**

~~~powershell
npm test
npm run build
git add .github/workflows/ci.yml README.md
git commit -m "chore: prepare repository for GitHub"
~~~

Expected: 6 Vitest files / 134 tests and the production build pass; the commit contains only CI and README changes.

### Task 3: 验证发布分支并安全推送 main

**Files:**
- Verify: package-lock.json, package.json, src/, .github/workflows/ci.yml, README.md
- Modify Git refs only: main, origin/main

**Interfaces:**
- Consumes: verified branch fix/guidance-hardening-final-review, base branch main, and remote git@github.com:1173598855-dot/-plus.git.
- Produces: fast-forwarded local main and a remote main that points to the same verified commit.

- [ ] **Step 1: Verify the branch tip before integration**

运行：

~~~powershell
npm test
npm run build
git diff --check
git status --short
~~~

Expected: 6 Vitest files / 134 tests pass, the build passes, git diff --check produces no output, and git status --short is empty.

- [ ] **Step 2: Fast-forward main without rewriting history**

运行：

~~~powershell
git switch main
git merge --ff-only fix/guidance-hardening-final-review
npm test
~~~

Expected: main advances without a merge commit, and the complete test suite still passes. Leave fix/guidance-hardening-final-review intact for local traceability.

- [ ] **Step 3: Configure and inspect the GitHub remote without overwriting it**

运行：

~~~powershell
$expected = 'git@github.com:1173598855-dot/-plus.git'
$origin = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  git remote add origin $expected
} elseif ($origin -ne $expected) {
  throw "origin points to '$origin', not '$expected'."
}
git remote -v
$remoteMainLine = git ls-remote --heads origin refs/heads/main
if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect origin/main.' }
if ($remoteMainLine) {
  git fetch origin refs/heads/main:refs/remotes/origin/main
  if ($LASTEXITCODE -ne 0) { throw 'Unable to fetch origin/main.' }
  git merge-base --is-ancestor refs/remotes/origin/main main
  if ($LASTEXITCODE -ne 0) { throw 'Remote main is not an ancestor of local main; refusing to overwrite it.' }
}
~~~

Expected: origin resolves to the expected SSH URL. If the remote has main, it is fetched and proven to be an ancestor of local main; otherwise the command stops before any push. No force-push is permitted.

- [ ] **Step 4: Push only the verified default branch and prove remote parity**

运行：

~~~powershell
git push -u origin main
$local = git rev-parse main
$remote = (git ls-remote --heads origin refs/heads/main).Split()[0]
if ($local -ne $remote) { throw "Remote main '$remote' does not match local main '$local'." }
~~~

Expected: push succeeds without force, and local/remote main commit IDs are identical.

- [ ] **Step 5: Report final repository state**

运行：

~~~powershell
git status --short --branch
git log --oneline --decorate -4
~~~

Expected: main is clean, tracks origin/main, and includes the archive-boundary, GitHub-entrypoint, and preceding completed implementation commits.
