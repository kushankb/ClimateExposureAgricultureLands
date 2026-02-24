# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An interactive globe visualization of **global agriculture exposure to future weather extremes** (CMIP6, SSP2-4.5, 2°C GMT warming). The app overlays climate raster data (CDD, FD, Rx5, Tx35) and farm size onto a dot map of food production breadbaskets, colored by food group.

Currently being **refactored from React + Mapbox GL → SvelteKit 5 + Mapbox GL**. The old React app lives in `/old-app/` as the reference implementation.

## Commands

```bash
npm run dev       # Start dev server (Vite, HMR)
npm run build     # Production build
npm run preview   # Preview production build locally
```

No test or lint scripts are configured yet.

## Stack

- **SvelteKit 2** with **Svelte 5 runes** (`$props()`, `{@render children()}` — not `<slot />`)
- **Vite 7** as build tool
- **Tailwind CSS 4** + **daisyUI 5** via `@tailwindcss/vite` plugin (imported in `src/app.css`)
- **Mapbox GL** for the interactive globe

## Architecture

### SvelteKit App (`src/`)

File-based routing under `src/routes/`:
- `+layout.svelte` — root layout, imports favicon, uses Svelte 5 snippet runes
- `+page.svelte` — main app page (currently scaffold placeholder)
- `old-app/+page.svelte` — placeholder route for reference/migration

Reusable exports go in `src/lib/index.js`.

### Old React App (`old-app/`) — Reference Implementation

The full working React app to port from. Key files:

| File | Role |
|---|---|
| `src/App.js` | Root state: `activeLayers`, `layerOpacity`, `selectedPercentile`, `legendConfig` |
| `src/components/Map.js` | Mapbox GL map — initializes globe, adds all sources/layers, syncs visibility/opacity/percentile |
| `src/components/ControlPanel.js` | Sidebar with layer toggles, opacity sliders, percentile selector (p05/p50/p95) |
| `src/components/Legend.js` | `RasterLegend` (gradient bar) + `BreadbasketLegend` (categorical swatches) |
| `src/layers/tilesetIds.js` | **Single source of truth** for layer config: `BREADBASKET`, `RASTER_OVERLAYS`, `FOOD_GROUP_COLORS`, `LAYER_DESCRIPTIONS`, `getTileDir()` |

### Map Layer Architecture

**Base layer:** Breadbasket dots — Mapbox-hosted vector tileset (`mapbox://plotline.cndbsry2`), colored by `max_food_group` field using `FOOD_GROUP_COLORS`.

**Raster overlays:** Static PNG tiles served from two sources depending on environment:
- **Dev:** local tile server at `http://localhost:8765` (avoids watching 284K files in Vite)
- **Prod:** GitHub Pages tile repo at `https://kushankbajaj.com/exposure-tiles`

Climate variables (CDD, FD, Rx5, Tx35) each have **3 tile directories** — one per percentile (`p05`/`p50`/`p95`). Farm size has a single directory. All sources and layers are added at map init; visibility is toggled via `setLayoutProperty("visibility", "visible"/"none")`.

### Environment / Tokens

Mapbox public token is injected as `window.__MAPBOX_TOKEN__` at runtime (see `old-app/.env.example` for the old React approach). In the new SvelteKit app, use `PUBLIC_MAPBOX_TOKEN` as a Vite env variable (`$env/static/public`).
