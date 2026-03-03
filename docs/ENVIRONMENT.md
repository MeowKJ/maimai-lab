# Unified Environment Variables

## Goal
Single naming convention across Python bot + Node services + Vite frontend.

Convention:
- backend/runtime vars: `MAIMAI_*`
- Vite vars: `VITE_MAIMAI_*`

## Root `.env`
Use root `.env` as the primary source of truth:

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
- `MAIMAI_IMAGE_CACHE_PORT`
- `MAIMAI_IMAGEKIT_PUBLIC_KEY`
- `MAIMAI_IMAGEKIT_PRIVATE_KEY`
- `MAIMAI_IMAGEKIT_URL_ENDPOINT`
- `MAIMAI_LEGACY_ASSET_ORIGIN`
- `VITE_MAIMAI_LXNS_API_KEY`

## Backward Compatibility
Current code supports old names as fallback during migration:

- Python bot:
  - `DEBUG` -> `MAIMAI_DEBUG`
  - `BOT_APPID` -> `MAIMAI_BOT_APPID`
  - `BOT_SECRET` -> `MAIMAI_BOT_SECRET`
  - `BOT_VERSION` -> `MAIMAI_BOT_VERSION`
  - `LXNS_API_SECRET` -> `MAIMAI_LXNS_API_SECRET`
  - `ASSETS_URL` -> `MAIMAI_ASSETS_URL`
  - `IMAGES_SERVER_ADDRESS` -> `MAIMAI_IMAGE_SERVER_URL`
  - `DEFAULT_AVATAR_URL` -> `MAIMAI_DEFAULT_AVATAR_URL`
  - `DATABASE_PATH` -> `MAIMAI_DATABASE_PATH`
  - `TEMP_FOLDER` -> `MAIMAI_TEMP_DIR`
- image-cache:
  - `PORT` -> `MAIMAI_IMAGE_CACHE_PORT`
  - `IMAGEKIT_PUBLIC_KEY` -> `MAIMAI_IMAGEKIT_PUBLIC_KEY`
  - `IMAGEKIT_PRIVATE_KEY` -> `MAIMAI_IMAGEKIT_PRIVATE_KEY`
  - `IMAGEKIT_URL_ENDPOINT` -> `MAIMAI_IMAGEKIT_URL_ENDPOINT`
  - `LEGACY_ASSET_ORIGIN` -> `MAIMAI_LEGACY_ASSET_ORIGIN`
- rating-web:
  - `VITE_API_KEY` -> `VITE_MAIMAI_LXNS_API_KEY`

## Contract Validation
`scripts/env_contract.py` verifies that required keys exist in:

- `.env.example`
- `apps/image-cache/.env.example`
- `apps/rating-web/.env.example`

Run:

```bash
python scripts/env_contract.py
```
