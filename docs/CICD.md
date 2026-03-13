# CI/CD

Workflow file:
- `.github/workflows/ci-cd.yml`

## Pipeline Stages
1. `env-contract`
   - validates Bot env template completeness via `python apps/bot/scripts/env_contract.py`
2. `python-tests`
   - installs `apps/bot/requirements.txt`
   - runs `cd apps/bot && python -m pytest -q`
3. `web-build`
   - installs root pnpm dependencies
   - builds `apps/web`
4. `deploy-preview` (optional)
   - trigger: `pull_request`
   - condition: Vercel secrets exist
   - deploy target: preview
5. `deploy-production` (optional)
   - trigger: push to `main`
   - condition: Vercel secrets exist
   - deploy target: production

## Required GitHub Secrets
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Without these secrets, deploy jobs are skipped automatically and CI still runs.

## Trigger Rules
- `pull_request`: runs validation + tests + build (+ preview deploy when secrets exist)
- `push` to `main`: runs validation + tests + build (+ production deploy and optional bot deploy when secrets exist)
- `workflow_dispatch`: manual full run
