#!/usr/bin/env bash
# Web-session setup for Claude Code on the web. Invoked by the environment's
# setup script so these prerequisites are version-controlled and fixable via PR.
set -euo pipefail

# Run from the repo root no matter where the caller invoked us from.
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Deterministic install; fall back to `npm install` if the lockfile ever drifts
# so setup still succeeds. (A fallback is a signal the lock should be re-committed.)
npm ci || npm install

# Ensure the pinned Chromium is present for Playwright-driven tooling (e.g. the
# chrome-devtools MCP server, which resolves the browser via
# chromium.executablePath()). The managed web image already ships Chromium under
# PLAYWRIGHT_BROWSERS_PATH, and @playwright/test is pinned in package.json to the
# version whose Chromium revision matches that build, so this is normally a fast
# no-op. Guard with `|| true` so a transient download hiccup can't abort setup.
#
# Do NOT pass --with-deps: it forces Playwright to run `apt-get`, which can exit
# non-zero on this image for reasons unrelated to this repo and is fatal under
# `set -e`. The OS libs are already present, so the browser alone is all we need.
npx playwright install chromium || true
