import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    # Entering the context manager runs FastAPI's startup/lifespan handlers.
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_prices_endpoint_returns_list(client):
    response = client.get("/api/v1/prices")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_analytics_summary_has_expected_fields(client):
    response = client.get("/api/v1/analytics/summary?region=ES")
    assert response.status_code == 200
    payload = response.json()
    assert "record_count" in payload
    assert "average_price_eur_mwh" in payload
    assert payload["record_count"] >= 1


def test_invalid_date_range_is_rejected(client):
    response = client.get(
        "/api/v1/prices?start_date=2026-10-31&end_date=2026-10-01"
    )
    assert response.status_code == 400
