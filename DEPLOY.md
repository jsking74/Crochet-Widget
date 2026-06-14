# Deploying the Crochet Pattern Generator

This is a **static site** — `npm run build` produces a `dist/` folder of plain
HTML/CSS/JS. It runs entirely in the visitor's browser; there is no backend,
database, or secret to configure. That also means it's fully portable: the exact
same `dist/` runs on Cloudflare, on nginx, or on your own hardware. You never
lose control of it.

## Option A — Cloudflare, connected to GitHub (recommended)

Cloudflare serves the built `dist/` as static assets (the Workers "Builds"
flow). Auto-deploys every time you push.

1. Log in at <https://dash.cloudflare.com> → **Workers & Pages** → **Create** →
   **Import a repository**.
2. Authorize and pick the **`jsking74/mithril-matrix`** repo.
3. Set / confirm:
   - **Project name:** `crochet-pattern-generator`
   - **Root directory (Advanced settings):** `crochet-app`  ← important; the app
     lives in a subfolder.
   - **Build command:** `npm ci && npm run build`  ← change from the auto-filled
     `pnpm run build`; this app uses npm, not the monorepo's pnpm.
   - **Deploy command:** `npx wrangler deploy`  (already correct)
   - **Production branch:** `claude/crochet-pattern-generation-kae7kn` (or `main`
     once merged) so pushes deploy live instead of just uploading a preview.
   - Node version is pinned by `.node-version` (20). The asset directory and
     SPA fallback come from `wrangler.toml`, so no extra config is needed.
4. **Deploy.** You'll get a URL like
   `https://crochet-pattern-generator.<account>.workers.dev`.

## Option B — From the CLI (no Git hookup)

Fastest one-off deploy from your machine:

```bash
cd crochet-app
npm install
npm run build
npx wrangler deploy     # first run will prompt you to log in
```

## Option C — Self-host (your own hardware, later)

The static build runs on any web server. Two quick paths:

```bash
# Quick local/LAN test:
cd crochet-app && npm run build && npx serve dist

# Or a container you can run on dedicated hardware:
#   docker run --rm -p 8080:80 -v "$PWD/dist:/usr/share/nginx/html:ro" nginx
```

Point nginx/Caddy at the `dist/` folder and add a SPA fallback to
`index.html` (the included `public/_redirects` already encodes this for hosts
that read it).

## Notes

- No environment variables or API keys are required.
- `public/_redirects` provides the single-page fallback; `public/_headers` sets
  long-cache on hashed assets and no-cache on the service worker so updates roll
  out cleanly. Both are Cloudflare Pages conventions and are ignored harmlessly
  by hosts that don't use them.
