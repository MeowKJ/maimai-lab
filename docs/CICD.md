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
6. `deploy-bot-ubuntu`
   - trigger: push to `main`, after Python tests pass
   - GitHub Environment: `bot-production`
   - deploy target: the Ubuntu Bot host through SSH, then restarts `maimai-bot.service`

## Required GitHub Secrets
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Without these secrets, deploy jobs are skipped automatically and CI still runs.

## QQ Bot Production Environment

Configure the following secrets in the `bot-production` GitHub Environment:

- `MAIMAI_BOT_APPID`
- `MAIMAI_BOT_SECRET`
- `MAIMAI_LXNS_API_SECRET`
- `BOT_SSH_HOST`
- `BOT_SSH_PORT`
- `BOT_SSH_USER`
- `BOT_SSH_KEY`
- `BOT_DEPLOY_PATH`
- `BOT_SYSTEMD_SERVICE`

The deploy job creates `/etc/maimai-bot/production.env` directly on the host.
It is owned by `root:maimai` with mode `0640`, and is never committed into the
repository. The systemd unit runs the Bot as the unprivileged `maimai` user.

## Trigger Rules
- `pull_request`: runs validation + tests + build (+ preview deploy when secrets exist)
- `push` to `main`: runs validation + tests + build (+ production deploy and optional bot deploy when secrets exist)
- `workflow_dispatch`: manual full run
