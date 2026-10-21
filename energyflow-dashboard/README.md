# EnergyFlow Market Analytics Dashboard

A responsive static dashboard for the EnergyFlow FastAPI portfolio backend. It displays market summary KPIs and, when the API exposes individual price records, a Chart.js trend chart and searchable/exportable records table.

## Requirements
- The EnergyFlow FastAPI backend running locally at `http://127.0.0.1:8000`.
- A modern browser and an internet connection for Google Fonts and Chart.js CDN.

## Run locally

1. Start your backend from the backend project folder:

   ```bash
   source .venv/bin/activate
   uvicorn app.main:app --reload
   ```

2. In a second Terminal tab, open the dashboard folder and start a simple static server:

   ```bash
   cd energyflow-dashboard
   python3 -m http.server 5500
   ```

3. Visit `http://127.0.0.1:5500`.

Do not open `index.html` directly using `file://`; use the local static server instead.

## API routes used
- `GET /api/v1/analytics/summary?region=ES` — required. The dashboard maps the fields shown in the project's summary response (`region`, `record_count`, `average_price_eur_mwh`, `minimum_price_eur_mwh`, `maximum_price_eur_mwh`, `standard_deviation_eur_mwh`).
- `GET /api/v1/prices?region=ES` — optional for chart and table. The dashboard supports common response wrappers (`items`, `records`, `data`, `results`, `prices`) and common price field names. If your backend's actual route or schema differs, check `http://127.0.0.1:8000/docs` and update `PRICE_PATH` / `normalizeRecords()` in `app.js`.

## Hosting notes
The dashboard is static and can be hosted on GitHub Pages. The Python API must be deployed separately to a Python-capable host; GitHub Pages cannot run FastAPI. Once deployed, change `API_BASE` in `app.js` to the deployed API URL. Configure CORS in FastAPI to allow the dashboard's origin before connecting a hosted frontend to the API.

## Data note
The current backend response shown in the demo uses sample data. Do not describe it as live market data unless you connect a verified live data provider.
