# Deploy on Netlify

This app is a **static PWA**: `npm run build` writes `dist/`, and all project data lives in the browser (**IndexedDB**). No server or database on Netlify.

## One-time setup

1. Sign in at [Netlify](https://www.netlify.com/) and choose **Add new site → Import an existing project**.
2. Connect **GitHub** and select the `project-over-due` repository.
3. Netlify reads **[netlify.toml](../netlify.toml)** at the repo root:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **SPA fallback:** all routes rewrite to `index.html` (required for `/import` and `/projects/:id`).
4. Deploy. Netlify provides an **HTTPS** URL (e.g. `https://something.netlify.app`). You can rename the site or attach a custom domain later.

### Optional: deploy from CLI

```bash
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod --dir=dist
```

Use **Import from Git** for automatic deploys on every push to `main`.

## After deploy — smoke test

On the live URL (desktop or phone):

1. Open `/`, add or edit a task, reload — data should persist (IndexedDB).
2. Open **DevTools → Application** (Chrome): confirm **Service worker** is active and **Manifest** loads.
3. Visit `/import` and a `/projects/<id>` link directly (paste in address bar) — each should load the app, not a 404.

## Install as PWA (“Add to Home Screen”)

HTTPS is required; Netlify provides it by default.

### Android (Chrome)

1. Open the site in Chrome.
2. Tap the menu (⋮) → **Install app** or **Add to Home screen**.
3. Confirm. The app opens in standalone mode (no browser chrome).

### iOS (Safari)

1. Open the site in **Safari** (install from Chrome on iOS is limited).
2. Tap **Share** (□↑).
3. Tap **Add to Home Screen**, edit the name if you like, then **Add**.

### Desktop (Chrome / Edge)

Use the install icon in the address bar, or **Install Home Projects** from the app menu.

## Data & backups

- Data is stored **only on the device** that used the PWA (per browser profile).
- Use **Settings → Export backup** in the app before clearing site data or switching devices.

## Local production preview

```bash
npm run build
npm run preview
```

Serves `dist/` at `http://localhost:4173` (useful before pushing to Netlify).
