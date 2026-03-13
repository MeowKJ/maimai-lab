# Setup

## 1. Python Bot

安装依赖：

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r apps/bot/requirements.txt
```

配置环境变量：

```bash
cp apps/bot/.env.example apps/bot/.env
```

至少需要填写：

- `MAIMAI_BOT_APPID`
- `MAIMAI_BOT_SECRET`
- `MAIMAI_LXNS_API_SECRET`

运行 Bot：

```bash
python apps/bot/main.py
```

## 2. Web

切换到仓库要求的 Node 版本：

```bash
nvm use
```

安装依赖并配置环境变量：

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
```

本地开发：

```bash
pnpm dev
```

生产构建：

```bash
pnpm build
```

## 3. Validate Env Contract

当前环境变量契约校验脚本只检查 Bot 模板：

```bash
python apps/bot/scripts/env_contract.py
```
