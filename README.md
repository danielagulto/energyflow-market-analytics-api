# EnergyFlow Market Analytics API

A portfolio-ready Python backend for electricity market price data. Built with **FastAPI, Pydantic, SQLAlchemy, Pandas, SQLite, Pytest, and GitHub Actions**.

> This is an educational portfolio project using clearly labeled sample data. It is not a live trading system and does not provide financial advice.

## Features

- REST API with interactive OpenAPI docs
- Store and query electricity prices by date and region
- Validate incoming data with Pydantic
- Calculate averages, minimum/maximum prices, and volatility
- Import CSV price data
- Persist data in SQLite
- Automated tests and GitHub Actions CI

## Requirements

- Python 3.11 or newer
- Git (optional, for version control)

## Run locally on macOS

```bash
# 1. Unzip the project and enter its folder
cd energyflow-market-analytics-api

# 2. Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# 4. Start the API
uvicorn app.main:app --reload
```

Open:
- API docs: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/api/v1/health
- Prices: http://127.0.0.1:8000/api/v1/prices
- Analytics: http://127.0.0.1:8000/api/v1/analytics/summary

On first startup, the app creates the database and inserts a small sample dataset if the database is empty.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/prices` | List prices; optional `region`, `start_date`, `end_date` |
| GET | `/api/v1/prices/{price_id}` | Get one price record |
| POST | `/api/v1/prices` | Create a price record |
| POST | `/api/v1/prices/import-csv` | Import CSV records |
| GET | `/api/v1/analytics/summary` | Summary metrics for a date range and region |

### Example: create a price

```bash
curl -X POST http://127.0.0.1:8000/api/v1/prices \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-10-20T10:00:00",
    "region": "ES",
    "price_eur_mwh": 82.5,
    "source": "manual-demo"
  }'
```

### Example: analytics query

```bash
curl "http://127.0.0.1:8000/api/v1/analytics/summary?region=ES&start_date=2026-10-01&end_date=2026-10-31"
```

### CSV import format

CSV must contain these headers:

```csv
timestamp,region,price_eur_mwh,source
2026-10-20T10:00:00,ES,82.5,demo-csv
2026-10-20T11:00:00,ES,79.2,demo-csv
```

Use the interactive docs (`/docs`) to upload a CSV to `POST /api/v1/prices/import-csv`.

## Run tests

```bash
pytest
```

## Upload to GitHub

1. Create a new **public** repository named `energyflow-market-analytics-api`.
2. Extract this ZIP file.
3. In Terminal, `cd` into the extracted project folder.
4. Run:

```bash
git init
git add .
git commit -m "Build EnergyFlow market analytics API"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/energyflow-market-analytics-api.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. If Git asks you to authenticate, complete the sign-in flow.

## Project structure

```text
app/
  api/routes/       # API endpoints
  core/             # Configuration
  db/               # Database session and setup
  models/           # SQLAlchemy models
  schemas/          # Pydantic request/response schemas
  services/         # Analytics logic
  main.py           # FastAPI application
data/               # Sample CSV
tests/              # Automated tests
.github/workflows/  # CI workflow
```

## Important notes

- The included sample records are illustrative, not official market data.
- SQLite is appropriate for a simple local portfolio demo. For a multi-user production deployment, use managed PostgreSQL and configure a persistent database.
- GitHub stores the source code; it does not run this FastAPI backend as a live API. Deploy it to a Python-capable hosting platform when you're ready.
