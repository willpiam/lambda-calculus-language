#!/usr/bin/env bash
# Install a pinned CodeMirror subset in a temp directory and write one ESM bundle.
# Commit website/vendor/codemirror.js, not the temp node_modules.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# @codemirror/state@6.7.6 @codemirror/view@6.43.14 @codemirror/commands@6.11.1
cat >"$WORK/package.json" <<'EOF'
{
  "private": true,
  "dependencies": {
    "@codemirror/commands": "6.11.1",
    "@codemirror/state": "6.7.6",
    "@codemirror/view": "6.43.14",
    "esbuild": "0.25.10"
  }
}
EOF

if command -v bun >/dev/null 2>&1; then
  (cd "$WORK" && bun install --no-progress)
elif command -v npm >/dev/null 2>&1; then
  (cd "$WORK" && npm install --no-fund --no-audit)
else
  echo "Need bun or npm to vendor CodeMirror." >&2
  exit 1
fi

cp "$ROOT/scripts/codemirror_entry.js" "$WORK/entry.js"
mkdir -p "$ROOT/website/vendor"
"$WORK/node_modules/esbuild/bin/esbuild" "$WORK/entry.js" \
  --bundle \
  --format=esm \
  --minify \
  --legal-comments=inline \
  --banner:js='/*! @codemirror/state@6.7.6 @codemirror/view@6.43.14 @codemirror/commands@6.11.1 */' \
  --outfile="$ROOT/website/vendor/codemirror.js"
