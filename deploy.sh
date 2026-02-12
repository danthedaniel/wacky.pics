#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="deploy-wacky.pics"
REMOTE_DIR="~/app"

ssh "${REMOTE_HOST}" "sudo /usr/bin/systemctl stop wacky-pics"

rsync -avz --delete \
  --filter=':- .gitignore' \
  --exclude='.git/' \
  ./ "${REMOTE_HOST}:${REMOTE_DIR}/"

ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR} && ~/.bun/bin/bun install --frozen-lockfile && sudo /usr/bin/systemctl start wacky-pics"
