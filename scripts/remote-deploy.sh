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
# Env files hold the OpenAI key: keep them readable by root only.
chmod 600 .env .env.bootstrap 2>/dev/null || true

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

write_image_pin() {
  {
    echo "HANDAHANA_IMAGE=${HANDAHANA_IMAGE}"
    echo "NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH:-/hadahana}"
    echo "HANDAHANA_BIND_ADDRESS=${HANDAHANA_BIND_ADDRESS:-127.0.0.1}"
    echo "HANDAHANA_PORT=${HANDAHANA_PORT:-4132}"
  } > .env.images.tmp
  chmod 600 .env.images.tmp
  mv .env.images.tmp .env.images
}
write_image_pin

persist_image_pin() {
  # Keep normal `docker compose up` consistent with a successful rollback too.
  awk -v image="$HANDAHANA_IMAGE" '!/^HANDAHANA_IMAGE=/ {print} END {print "HANDAHANA_IMAGE=" image}' .env > .env.tmp
  chmod 600 .env.tmp
  mv .env.tmp .env
}

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

# Capture the actual old image, not the .env pin (CD has already updated it).
# Never treat a Created/exited/unhealthy container as a known-good rollback.
previous_image=""
old_id="$(compose ps -a -q handahana-web)"
if [[ -n "$old_id" ]] && [[ "$(docker inspect --format '{{.State.Status}}' "$old_id")" == running ]] \
  && [[ "$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$old_id")" == healthy ]]; then
  previous_image="$(docker inspect --format '{{.Image}}' "$old_id")"
  printf '%s\n' "$previous_image" > .last-good-image.tmp
  chmod 600 .last-good-image.tmp
  mv .last-good-image.tmp .last-good-image
elif [[ -s .last-good-image ]]; then
  previous_image="$(<.last-good-image)"
fi

wait_healthy() {
  local id state
  id="$(compose ps -a -q handahana-web)"
  [[ -n "$id" ]] || return 1
  for _ in $(seq 1 95); do
    state="$(docker inspect --format '{{.State.Status}}/{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$id")"
    case "$state" in
      running/healthy) return 0 ;;
      exited/*|dead/*|running/unhealthy) return 1 ;;
    esac
    sleep 2
  done
  return 1
}

rollback() {
  echo "New Handahana image failed to start healthy."
  compose ps || true
  # No env dumps or application logs: these may contain private birth data.
  if [[ -z "$previous_image" ]]; then
    echo "No known-good previous image recorded; automatic rollback unavailable."
    return 1
  fi
  echo "Restoring the previous known-good Handahana image."
  export HANDAHANA_IMAGE="$previous_image"
  write_image_pin
  persist_image_pin
  # Ownership init has already passed; do not let an init dependency block recovery.
  if compose up -d --no-build --no-deps handahana-web && wait_healthy; then
    echo "Previous Handahana image restored and healthy. Deployment still fails."
  else
    echo "CRITICAL: previous Handahana image could not be restored healthy."
  fi
  return 1
}

# Preflight volume migration BEFORE Compose can replace the old web container.
# A one-off run propagates init failures without touching any existing service.
echo "Checking Handahana data ownership before replacing web…"
# Note: `compose run --no-build` is not supported by the droplet's Docker Compose 2.37; data-init has no build section, and --pull never keeps it on the loaded image.
if ! compose run --rm --no-deps --pull never handahana-data-init; then
  echo "Data init failed; existing Handahana web container was not replaced."
  exit 1
fi

echo "Starting compose project ${COMPOSE_PROJECT_NAME} web only…"
if ! compose up -d --no-build --no-deps handahana-web; then
  rollback || true
  exit 1
fi
if ! wait_healthy; then
  rollback || true
  exit 1
fi

# Persist only after confirmed health.
persist_image_pin

# Immutable local image ID survives mutable tags / later failed deployments.
new_id="$(compose ps -a -q handahana-web)"
docker inspect --format '{{.Image}}' "$new_id" > .last-good-image.tmp
chmod 600 .last-good-image.tmp
mv .last-good-image.tmp .last-good-image

echo "Handahana is healthy at http://127.0.0.1:${HANDAHANA_PORT:-4132}${NEXT_PUBLIC_BASE_PATH:-/hadahana}"
compose ps
