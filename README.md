# Vancouver Parks Tracker

Static website for mapping City of Vancouver parks (from pre-converted GeoJSON) and tracking:
- visited parks
- favorite parks
- notes per park

User data is stored locally in the browser with `localStorage`. No backend is required.

## Run locally

Use any static file server. Example with Python:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## VS Code workspace setup

This workspace includes VS Code task and launch configuration files in `.vscode/`.

- Task: `Run local server (Python 8080)`
- Launch: `Open app in Chrome (localhost:8080)`

Quick start in VS Code:

1. Run the task `Run local server (Python 8080)`.
2. Start the launch profile `Open app in Chrome (localhost:8080)`.

If Python is not available, use the Live Server extension recommendation in `.vscode/extensions.json`.

## Data setup (shapefile to GeoJSON)

Pre-convert your shapefile before deployment.

Example with GDAL:

```bash
ogr2ogr -f GeoJSON data/parks.geojson /path/to/parks.shp -lco RFC7946=YES -lco COORDINATE_PRECISION=5
```

Expected properties per feature:
- `parkId` (preferred stable ID), or one of `PARK_ID`, `OBJECTID`, `id`
- `name` (preferred display name), or one of `PARK_NAME`, `park_name`

If no source ID exists, the app generates a deterministic fallback from name and index.

## Deploy

Deploy as static files on GitHub Pages, Netlify, or similar.

## Notes

- Basemap uses CARTO Positron tiles (OpenStreetMap data).
- Keep GeoJSON size small for better mobile performance.
- localStorage data is per browser/device and does not sync automatically.
