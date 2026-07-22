# Public by Law

CDW Assignment 6 — Geospatial Structures

This project maps New York City Privately Owned Public Spaces (POPS). It classifies the selected POPS as `Open Space` or `Interior Space`, excludes circulation-only types, and scales point size by the number of required amenities.

## Files

- `index.html` — project page
- `style.css` — page and interface styling
- `mapBox_Sketch_03.js` — Mapbox map, layers, search, popups, and toggles
- `public_spaces.geojson` — processed POPS data

## Run locally

Use VS Code Live Server. Do not open `index.html` directly from Finder because the browser may block the local GeoJSON request.

## Change the basemap

1. Create or duplicate a style in Mapbox Studio.
2. Publish the style.
3. Copy its Style URL.
4. Open `mapBox_Sketch_03.js`.
5. Replace:

```js
const BASEMAP_STYLE = 'mapbox://styles/mapbox/light-v11';
```

with your published style URL.

## Change point colors

Edit these values near the top of `mapBox_Sketch_03.js`:

```js
const OPEN_SPACE_COLOR = '#E3C95E';
const INTERIOR_SPACE_COLOR = '#8F9D82';
```

Mapbox Studio controls the basemap. These JavaScript constants control the POPS points and legend.


## Current point palette

- Open Space: muted yellow `#E3C95E`
- Interior Space: muted sage green `#8F9D82`
- Point outlines are disabled.
