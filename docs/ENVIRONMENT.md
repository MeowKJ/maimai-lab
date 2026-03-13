# Environment Variables

当前仓库没有统一的根 `.env` 约定，环境变量分别放在各自应用目录中：

- `apps/bot/.env`
- `apps/web/.env.local`

## Bot

模板文件：`apps/bot/.env.example`

主要变量：

- `MAIMAI_DEBUG`
- `MAIMAI_BOT_APPID`
- `MAIMAI_BOT_SECRET`
- `MAIMAI_BOT_VERSION`
- `MAIMAI_LXNS_API_SECRET`
- `MAIMAI_ASSETS_URL`
- `MAIMAI_IMAGE_SERVER_URL`
- `MAIMAI_DEFAULT_AVATAR_URL`
- `MAIMAI_DATABASE_PATH`
- `MAIMAI_TEMP_DIR`

Bot 仍兼容一组旧变量名，例如 `BOT_APPID`、`BOT_SECRET`、`LXNS_API_SECRET`。兼容逻辑位于 `apps/bot/src/core/settings.py`。

## Web

模板文件：`apps/web/.env.example`

主要变量：

- `MAIMAI_LXNS_API_KEY`
- `NEXT_PUBLIC_MAIMAI_LXNS_API_KEY`
- `MAIMAI_IMAGEKIT_PUBLIC_KEY`
- `MAIMAI_IMAGEKIT_PRIVATE_KEY`
- `MAIMAI_IMAGEKIT_URL_ENDPOINT`
- `MAIMAI_LEGACY_ASSET_ORIGIN`

其中 `NEXT_PUBLIC_*` 变量会暴露到浏览器，优先使用服务端变量。

## Contract Validation

当前自动契约校验只覆盖 Bot 模板：

```bash
python apps/bot/scripts/env_contract.py
```
