# B50 Bot Architecture (Modern)

## Core Goal
QQ 频道/群消息触发 `/bind` 和 `/b50`，生成并返回 B50 图片。

## Layering
- `main.py`: bootstrapping and runtime checks.
- `src/core/settings.py`: single source of truth for env configuration.
- `src/app/client.py` + `src/app/router.py`: message routing.
- `src/features/b50/command.py`: thin controller (message in/out).
- `src/features/b50/service.py`: B50 domain/service logic.
- `src/features/b50/draw.py`: existing B50 image rendering (preserved).
- `src/infra/*`: infra (assets, db, temp files, upload).
- `src/interfaces/qq/message.py`: QQ message adapter.
- `src/domain/maimai/*`: score domain model and platform integration.

## B50 Flow
1. `/bind` -> parse input -> infer platform -> persist binding.
2. `/b50` -> read binding -> query score API -> render image -> upload/reply.

## Assets Fetching
`src/infra/assets/get.py`:
- lookup local cache first (`static/<asset_type>/<name>`),
- fallback to remote download via `MAIMAI_ASSETS_URL`,
- JSON endpoints cached for 24h in `static/json`.

## Config
- runtime config: `.env`
- template: `.env.example`
- loader: `src/core/settings.py`
·