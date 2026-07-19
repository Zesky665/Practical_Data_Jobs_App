#!/usr/bin/env bash
# Push env vars from .env.local to Vercel (production + preview + development).
# Safe: secrets never leave your machine; piped straight into `vercel env add`.
#
# Usage:
#   ./scripts/sync-vercel-env.sh          # push all vars from .env.local
#   ./scripts/sync-vercel-env.sh --prod   # push to production env only
#
# Idempotent: --force overwrites existing vars.
# Requires: authenticated `vercel` CLI + a linked project (`vercel link`).
# Compatible with macOS system Bash 3.2.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found." >&2
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "ERROR: vercel CLI not installed. Run: npm i -g vercel" >&2
  exit 1
fi

# Default target environments (--prod restricts to production only)
ENVS="production preview development"
if [[ "${1:-}" == "--prod" ]]; then
  ENVS="production"
fi

failed=0
tmp="$(mktemp -t vercelsync.XXXXXX)"
trap 'rm -f "$tmp"' EXIT

while IFS= read -r line || [[ -n "$line" ]]; do
  case "$line" in
    ''|'#'*) continue ;;
  esac

  key="${line%%=*}"
  val="${line#*=}"
  # strip optional surrounding single or double quotes
  val="${val#\"}"; val="${val%\"}"
  val="${val#\'}"; val="${val%\'}"

  [[ -z "$key" ]] && continue

  for env in $ENVS; do
    # Preview requires a 4th "git branch" arg; "" = all branches.
    # (A named branch fails when the project has no connected Git repo,
    # which is the case for CLI-only / Codeberg deploys.)
    branch_arg=()
    [[ "$env" == "preview" ]] && branch_arg=("")

    # Piping vercel's stdout directly into grep crashes this CLI build
    # ("Abort trap: 6"); redirect to a temp file first, then inspect.
    if printf "%s" "$val" | vercel env add "$key" "$env" ${branch_arg[@]+"${branch_arg[@]}"} --force >"$tmp" 2>&1; then
      if grep -qE "Added|Overrode" "$tmp"; then
        echo "  + $key [$env]"
        continue
      fi
    fi
    echo "  ! $key [$env] failed — output:"
    sed 's/^/      /' "$tmp"
    failed=$((failed + 1))
  done
done < "$ENV_FILE"

echo ""
if [[ "$failed" -eq 0 ]]; then
  echo "Done. Pull to verify: vercel env pull .vercel/.env.development.local"
else
  echo "Done with $failed failure(s)."
  exit 1
fi
