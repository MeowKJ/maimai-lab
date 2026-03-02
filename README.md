# maimai-lab

- Python QQ 机器人（查分 / 图片生成功能）
- Next.js Web（新版 B50 + 计算器）
- 资源缓存服务（image-cache）

## 环境要求

- Python `3.11+`
- Node.js `22.x`（见 `.nvmrc`）
- pnpm `10+`

## 快速开始（Python Bot）

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

`.env` 至少需要配置：

- `MAIMAI_BOT_APPID`
- `MAIMAI_BOT_SECRET`
- `MAIMAI_LXNS_API_SECRET`

## 快速开始（新版 Web）

```bash
nvm use
pnpm install
pnpm dev
```

默认会启动 `apps/web`（Next.js）。

如果需要配置 Web 端环境变量，请参考：

- `apps/web/.env.example`

## Legacy 子应用与资源服务

常用脚本（根目录执行）：

```bash
pnpm web:dev:cache   # image-cache
pnpm web:dev:rating  # rating-web
pnpm web:dev:tools   # tools-web
pnpm web:build:legacy
```

## 常用脚本

```bash
pnpm dev         # 启动新版 Web
pnpm build       # 构建新版 Web
pnpm ci:env      # 校验环境变量契约（Python 脚本）
```

## 部署

- 根目录 `vercel.json` 已配置为 monorepo Web 部署入口。
- 资源缓存相关变量见 `.env.example` 与 `apps/image-cache/.env.example`。

## CI/CD

仓库内置工作流：`.github/workflows/ci-cd.yml`

- PR 到 `main`：
  - 环境变量模板校验
  - Python 测试
  - Web 构建
  - （可选）Vercel Preview 部署
- Push 到 `main`：
  - 同上校验与构建
  - Vercel Production 部署
  - Ubuntu 服务器 QQ 机器人自动发布（SSH）

需要在 GitHub Repository Secrets 中配置：

- Vercel 部署：
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
- Ubuntu 机器人部署：
  - `BOT_SSH_HOST`
  - `BOT_SSH_USER`
  - `BOT_SSH_KEY`
  - `BOT_DEPLOY_PATH`（服务器上的仓库路径）
  - `BOT_SSH_PORT`（可选，默认 `22`）
  - `BOT_SYSTEMD_SERVICE`（可选，例如 `maimai-bot`）

## 文档

- [Setup](docs/SETUP.md)
- [Web Monorepo](docs/WEB_MONOREPO.md)
