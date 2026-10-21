from datetime import date, datetime, time, timedelta

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.price import MarketPrice

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary")
def get_summary(
    region: str | None = Query(default=None, min_length=2, max_length=10),
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be on or before end_date")

    query = db.query(MarketPrice)
    if region:
        query = query.filter(MarketPrice.region == region.upper())
    if start_date:
        query = query.filter(MarketPrice.timestamp >= datetime.combine(start_date, time.min))
    if end_date:
        query = query.filter(MarketPrice.timestamp < datetime.combine(end_date + timedelta(days=1), time.min))

    records = query.order_by(MarketPrice.timestamp.asc()).all()
    if not records:
        return {
            "region": region.upper() if region else None,
            "record_count": 0,
            "average_price_eur_mwh": None,
            "minimum_price_eur_mwh": None,
            "maximum_price_eur_mwh": None,
            "standard_deviation_eur_mwh": None,
            "start_date": start_date,
            "end_date": end_date,
        }

    frame = pd.DataFrame(
        [{"price": record.price_eur_mwh} for record in records]
    )
    return {
        "region": region.upper() if region else "ALL",
        "record_count": int(len(frame)),
        "average_price_eur_mwh": round(float(frame["price"].mean()), 3),
        "minimum_price_eur_mwh": round(float(frame["price"].min()), 3),
        "maximum_price_eur_mwh": round(float(frame["price"].max()), 3),
        "standard_deviation_eur_mwh": round(float(frame["price"].std(ddof=0)), 3),
        "start_date": start_date,
        "end_date": end_date,
    }
