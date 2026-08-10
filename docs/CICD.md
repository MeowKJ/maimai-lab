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
4. `deploy-bot-ubuntu`
   - trigger: push to `main`, after Python tests pass
   - GitHub Environment: `bot-production`
   - deploy target: the Ubuntu Bot host through SSH, then restarts `maimai-bot.service`

The Web application is deployed directly by Vercel. GitHub Actions validates its
build, but does not deploy it or hold Vercel credentials.

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
- `push` to `main`: runs validation + tests + build, then deploys the QQ Bot.
- `workflow_dispatch`: manually runs the same pipeline, including a Bot deploy.
