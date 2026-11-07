# Hadahana Studio — droplet deploy (`ervanta.com/hadahana`)

Standalone repo (`helloyasura/hadahana`). Deploy stack is isolated from LUMS / GovFlow / BizFlow.

| Item | Value |
|------|--------|
| GitHub repo | `helloyasura/hadahana` |
| Compose project | `handahana` |
| Deploy dir | `/opt/handahana` |
| Loopback | `127.0.0.1:4132` |
| Public URL | `https://ervanta.com/hadahana` |
| Next `basePath` | `/hadahana` |
| GHCR image | `ghcr.io/<owner>/hadahana:<sha12>` |

## CI / CD

| Workflow | When | Effect |
|----------|------|--------|
| `.github/workflows/ci.yml` | PR / push | lint + production build |
| `.github/workflows/cd.yml` | push `main`/`master` + manual | build GHCR image, SCP to `/opt/handahana`, `compose up` **handahana only** |

## One-time droplet bootstrap

```bash
sudo mkdir -p /opt/handahana && sudo chown "$USER:$USER" /opt/handahana
cd /opt/handahana
cp .env.example .env
# set OPENAI_API_KEY if Name Studio / agent should call OpenAI
nano .env
```

Add nginx snippet from `deploy/nginx-hadahana.conf.example` into the **existing** `ervanta.com` server block, then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Do **not** change the `lums.ervanta.com` upstreams.

## Marketplace access

- `marketplace/ervanta-app.json` — `launchUrl: https://ervanta.com/hadahana`

## Manual deploy

```bash
docker build -t hadahana:local --build-arg NEXT_PUBLIC_BASE_PATH=/hadahana .
HANDAHANA_IMAGE=hadahana:local docker compose -p handahana up -d
curl -fsS -L http://127.0.0.1:4132/hadahana
```

App URL is `/hadahana` (no trailing slash). Host nginx must proxy `location /hadahana` without forcing a slash redirect.

## GitHub Environment secrets (Environment `droplet`)

| Name | Purpose |
|------|---------|
| `DROPLET_HOST` / `GOVFLOW_SSH_HOST` | SSH host |
| `GOVFLOW_SSH_USER` | SSH user |
| `GOVFLOW_SSH_KEY` | SSH private key |
| `HANDAHANA_OPENAI_API_KEY` | optional OpenAI key for Name Studio |
| `HANDAHANA_DEPLOY_PATH` | default `/opt/handahana` |
