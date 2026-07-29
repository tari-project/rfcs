# How rfc.tari.com is built and deployed

## TL;DR

Push to `main` → **Cloudflare Pages** builds the book with mdBook → publishes to
**https://rfc.tari.com**. That's the whole pipeline. GitHub Actions is **not** in
the publish path.

## The live path

1. You push / merge to `main` on `github.com/tari-project/rfcs`.
2. The **Cloudflare Pages GitHub App** (`cloudflare-workers-and-pages`, installed
   on the `tari-project` org) notifies the Cloudflare Pages project **`rfcs`**,
   which lives in the **"Tari and Yat"** Cloudflare account
   (`a5eaa078d76d43e7b6e386a3d0ff272d`).
3. Cloudflare clones the repo and runs the project's build command,
   **`bash scripts/build.sh`**, which installs the pinned mdBook + mdbook-mermaid
   and runs `mdbook build` (output: `./book`).
4. Cloudflare uploads `./book` to its CDN and serves it on the project's
   `*.pages.dev` domain and the custom domain **rfc.tari.com** (a proxied
   Cloudflare DNS record on the `tari.com` zone, configured in the Pages project —
   not in Terraform).
5. The build reports back to GitHub as the **"Cloudflare Pages"** check on the
   commit.

## The build recipe lives in one place

[`scripts/build.sh`](scripts/build.sh) is the single source of truth for how the
book is built, and it pins the mdBook / mdbook-mermaid versions. Both of these
call it:

- **Cloudflare Pages** — build command is `bash scripts/build.sh` (this is what
  actually publishes the site).
- **GitHub Actions** — `.github/workflows/rfc_deploy.yml` and `rfc_test.yml` run
  the same script on every push and PR, so a change that would break the real
  Cloudflare build turns CI red *before* it reaches `main`.

To change the mdBook version, edit `scripts/build.sh` only. Do **not** add a
second build recipe.

## Things that are NOT the deploy

- **`.github/workflows/rfc_deploy.yml`** no longer deploys. It used to push a
  build to the `gh-pages` branch for GitHub Pages; GitHub Pages for this repo was
  retired in 2024 and serves nothing. The workflow now just verifies the build.
- A green GitHub Actions run alone does not mean the site published. The
  authoritative signal is the **Cloudflare Pages check** on the commit, or the
  **Deployments** tab of the `rfcs` project in the Cloudflare dashboard.

## History / why this doc exists

Between 2026-06-17 and 2026-07-29 the site silently froze: PR #175 removed the old
`build.js` from the repo, but the Cloudflare Pages build command still called
`node build.js`, so every Cloudflare build failed with
`Cannot find module '.../build.js'`. GitHub Actions stayed green the whole time
because it built a different way, so nothing surfaced the failure. The fix was to
give Cloudflare and CI one shared build script (this setup) so they can never
drift apart again.

## Who can administer the Cloudflare project

The Pages project is in the **"Tari and Yat"** Cloudflare account. Membership is
via Google SSO. If you need access, ask a Super Administrator on that account to
invite you (the Cloudflare DNS is maintained primarily by nck@tari.com).
