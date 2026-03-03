# Setup

## 1. Install
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Configure
```bash
cp .env.example .env
```
Fill required fields in `.env`:
- `MAIMAI_BOT_APPID`
- `MAIMAI_BOT_SECRET`
- `MAIMAI_LXNS_API_SECRET`
- `MAIMAI_IMAGEKIT_PUBLIC_KEY` (for image-cache deploy)
- `MAIMAI_IMAGEKIT_PRIVATE_KEY` (for image-cache deploy)
- `MAIMAI_IMAGEKIT_URL_ENDPOINT` (for image-cache deploy)

## 3. Run
```bash
python main.py
```

## 4. Web Monorepo (optional)
Unified web stack lives in `apps/`:
- `apps/image-cache`
- `apps/rating-web`
- `apps/tools-web`

Use Node.js LTS (recommended: `22.x`, see `.nvmrc`):

```bash
nvm use
```

```bash
npm install
npm run web:build
npm run web:start
```

Vercel unified deployment config:
- root [`vercel.json`](/Users/kj/Desktop/maimai-lab/vercel.json)

## 5. Validate env contract
```bash
python scripts/env_contract.py
```
