# maimai-bot-plus

当前仓库包含两个实际应用：

- `apps/bot`：Python QQ 机器人，负责查分和图片生成
- `apps/web`：Next.js Web，提供 B50 页面和计算器

## 环境要求

- Python `3.11+`
- Node.js `22.x`（见 `.nvmrc`）
- pnpm `10+`

## 项目结构

```text
apps/
  bot/   # Python bot
  web/   # Next.js web
docs/    # 项目文档
```

## 快速开始

Bot：

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r apps/bot/requirements.txt
cp apps/bot/.env.example apps/bot/.env
python apps/bot/main.py
```

Web：

```bash
nvm use
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

## 常用脚本

```bash
pnpm dev      # 启动 apps/web
pnpm build    # 构建 apps/web
pnpm lint     # 校验 apps/web
pnpm ci:env   # 校验 apps/bot/.env.example 契约
```

## 部署

- `vercel.json` 当前直接部署 `apps/web`
- `.github/workflows/ci-cd.yml` 负责环境变量校验、Python 测试、Web 构建和可选部署

## 文档

- [Setup](docs/SETUP.md)
- [Environment](docs/ENVIRONMENT.md)
- [Web](docs/WEB.md)
- [CI/CD](docs/CICD.md)
