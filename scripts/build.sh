#!/usr/bin/env bash
#
# Canonical build for the Tari RFC book.
#
# This is the SINGLE source of truth for how the site is built. It is invoked
# by BOTH:
#   * Cloudflare Pages  (project "rfcs", account "Tari and Yat") — build command
#     is `bash scripts/build.sh`; this is what publishes https://rfc.tari.com
#   * GitHub Actions    (.github/workflows/rfc_deploy.yml) — runs it on every
#     push/PR so a change that would break the Cloudflare build fails CI first.
#
# Keeping both on this one script is deliberate: the site outage of
# 2026-06/07 happened because the Cloudflare build command and the repo drifted
# apart (the repo dropped build.js while Cloudflare still called it, and CI built
# a different way so nothing went red). Do not reintroduce a second build recipe.
#
# See DEPLOYMENT.md for the full picture.

set -euo pipefail

MDBOOK_VERSION="0.5.2"
MDBOOK_MERMAID_VERSION="0.17.0"

TOOLS_DIR="$(pwd)/.build-tools"
mkdir -p "$TOOLS_DIR"

echo "==> Installing mdBook ${MDBOOK_VERSION} and mdbook-mermaid ${MDBOOK_MERMAID_VERSION}"
curl -fsSL "https://github.com/rust-lang/mdBook/releases/download/v${MDBOOK_VERSION}/mdbook-v${MDBOOK_VERSION}-x86_64-unknown-linux-gnu.tar.gz" | tar -xz -C "$TOOLS_DIR"
curl -fsSL "https://github.com/badboy/mdbook-mermaid/releases/download/v${MDBOOK_MERMAID_VERSION}/mdbook-mermaid-v${MDBOOK_MERMAID_VERSION}-x86_64-unknown-linux-gnu.tar.gz" | tar -xz -C "$TOOLS_DIR"

export PATH="$TOOLS_DIR:$PATH"

mdbook --version
mdbook-mermaid --version

echo "==> Building book (output: ./book)"
mdbook build

echo "==> Done."
