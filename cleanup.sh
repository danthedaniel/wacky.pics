#!/usr/bin/env bash
set -euo pipefail

UPLOADS_DIR="$(dirname -- "$0")/uploads"
NOW=$(date +%s)
THREE_DAYS=$((3 * 24 * 60 * 60))
ONE_HOUR=$((60 * 60))

while read -r file; do
  birth=$(stat -c %W "$file")
  mtime=$(stat -c %Y "$file")

  # Skip files where birth time is unknown
  [ "$birth" -eq 0 ] && continue

  age=$((NOW - birth))
  touched_after=$((mtime - birth))

  if [ "$age" -gt "$THREE_DAYS" ] && [ "$touched_after" -lt "$ONE_HOUR" ]; then
    rm "$file"
  fi
done < <(find "$UPLOADS_DIR" -maxdepth 1 -type f)
