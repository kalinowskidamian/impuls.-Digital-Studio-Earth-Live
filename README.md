# Earth Live — Żywa planeta

A bilingual, interactive 3D globe showcasing live Earth signals. A project by **impuls. Digital Studio**.

## Current status

- `main`: protected by workflow convention — release branch, no application deployment yet.
- `QA`: first functional application, implemented as standalone `index.html` for rapid testing.

## Features

- Interactive 3D Earth (Globe.GL / Three.js), zoom, rotation and location markers.
- **USGS** earthquakes M2.5+ from the last 24h / 7d / 30d.
- **NASA EONET v3** curated natural events: wildfires, storms, volcanoes and others.
- Combined feed, category filters, time windows, event search, details and original source links.
- Polish and English, responsive desktop and mobile layout, refresh every 5 minutes.
- Graceful handling of partial upstream outages; no mock events or API keys.

> **Not an emergency warning service.** These datasets are curated and near-real-time, not guaranteed instantaneous or exhaustive. The 24h/7d/30d filters use the agencies' own published observation/event window.

## Run

There is no build step. Serve the repository root over HTTP:

```bash
python3 -m http.server 4173
# open http://localhost:4173
```

Opening index.html directly as a `file://` URL is not the intended test method.

## Deploy as QA preview on Cloudflare Pages

1. Create a **new** Cloudflare Pages project for this repo (do not overwrite the studio website).
2. Connect GitHub repo `kalinowskidamian/impuls.-Digital-Studio-Earth-Live`.
3. Select `main` as production branch; `QA` should be allowed for preview builds.
4. Framework preset: `None`; build command: `exit 0` (or empty); output directory: `/`.
5. `main` has only the README currently. QA contains the app. **Don't map a public production domain or merge to main before QA acceptance.**
6. After acceptance, merge `QA` to `main`, and optionally point `earth-live.impulsdigitalstudio.com` to the Pages project.

## Data and assets

- NASA EONET v3: https://eonet.gsfc.nasa.gov/docs/v3
- USGS GeoJSON feeds: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
- Globe.GL: https://globe.gl/
- Earth texture: `three-globe` example asset served via UNPKG.

The live app loads globe dependencies, imagery and fonts from third-party CDNs and data directly from NASA/USGS. No cookies or tracking scripts are included.

## Roadmap

- Move the QA proof of concept into separate ES modules, tests and a coherent asset pipeline.
- Add Cloudflare Worker caching/rate protection before any higher-traffic production launch.
- Review data licensing, operational monitoring and privacy documentation for the planned public address.
