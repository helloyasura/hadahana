#!/usr/bin/env bash
# Deploy ONLY the Handahana Compose project (`handahana` → /opt/handahana).
#
# Safe on the shared Ervanta droplet:
#   - never touches lums-docker, govflow, bizflow, homeos, PM2, or host nginx
#   - never docker system prune
#   - never stops containers outside project `handahana`
#
# Image delivery:
#   1. HANDAHANA_IMAGE_ARCHIVE (.tar.gz) via CD → docker load
#   2. else docker pull $HANDAHANA_IMAGE (optional)
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/handahana}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-handahana}"
HANDAHANA_IMAGE_ARCHIVE="${HANDAHANA_IMAGE_ARCHIVE:-}"

cd "$DEPLOY_PATH"

if [[ ! -f .env ]]; then
  echo "Missing ${DEPLOY_PATH}/.env — copy .env.example and set OPENAI_API_KEY / HANDAHANA_IMAGE."
  exit 1
fi

if [[ ! -f docker-compose.yml ]]; then
  echo "Missing ${DEPLOY_PATH}/docker-compose.yml"
  exit 1
fi

if [[ -z "${HANDAHANA_IMAGE:-}" ]]; then
  echo "HANDAHANA_IMAGE must be set (CD supplies ghcr.io/.../handahana-studio:<sha>)."
  exit 1
fi

{
  echo "HANDAHANA_IMAGE=${HANDAHANA_IMAGE}"
  echo "NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH:-/hadahana}"
  echo "HANDAHANA_BIND_ADDRESS=${HANDAHANA_BIND_ADDRESS:-127.0.0.1}"
  echo "HANDAHANA_PORT=${HANDAHANA_PORT:-4132}"
} > .env.images

compose() {
  docker compose \
    -p "${COMPOSE_PROJECT_NAME}" \
    -f docker-compose.yml \
    --env-file .env \
    --env-file .env.images \
    "$@"
}

if [[ -n "$HANDAHANA_IMAGE_ARCHIVE" && -f "$HANDAHANA_IMAGE_ARCHIVE" ]]; then
  echo "Loading Handahana image archive: $HANDAHANA_IMAGE_ARCHIVE"
  if [[ "$HANDAHANA_IMAGE_ARCHIVE" == *.gz ]]; then
    gunzip -c "$HANDAHANA_IMAGE_ARCHIVE" | docker load
  else
    docker load -i "$HANDAHANA_IMAGE_ARCHIVE"
  fi
elif [[ -n "${GHCR_TOKEN:-}" && -n "${GHCR_USER:-}" ]]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
  docker pull "$HANDAHANA_IMAGE"
else
  echo "No archive and no GHCR login — assuming image already present: $HANDAHANA_IMAGE"
fi

echo "Starting compose project ${COMPOSE_PROJECT_NAME} only…"
compose up -d --no-build --remove-orphans

echo "Waiting for Handahana health on loopback :${HANDAHANA_PORT:-4132}…"
base="${NEXT_PUBLIC_BASE_PATH:-/hadahana}"
ok=0
for _ in $(seq 1 30); do
  # Prefer /hadahana (no trailing slash); Next may 308 /hadahana/ → /hadahana
  if curl -fsS -L "http://127.0.0.1:${HANDAHANA_PORT:-4132}${base}" >/dev/null 2>&1 \
    || curl -fsS -L "http://127.0.0.1:${HANDAHANA_PORT:-4132}${base}/" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 2
done

if [[ "$ok" -ne 1 ]]; then
  echo "Handahana did not become healthy in time."
  compose ps || true
  compose logs --tail=80 || true
  exit 1
fi

echo "Handahana is up at http://127.0.0.1:${HANDAHANA_PORT:-4132}${base}"
echo "Point host nginx location ${base}/ at this port (see deploy/nginx-hadahana.conf.example)."
compose ps
