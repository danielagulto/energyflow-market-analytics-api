import io
from datetime import date, datetime

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.price import MarketPrice
from app.schemas.price import MarketPriceCreate, MarketPriceRead

router = APIRouter(prefix="/prices", tags=["Market prices"])


@router.get("", response_model=list[MarketPriceRead])
def list_prices(
    region: str | None = Query(default=None, min_length=2, max_length=10),
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be on or before end_date")

    query = db.query(MarketPrice)
    if region:
        query = query.filter(MarketPrice.region == region.upper())
    if start_date:
        query = query.filter(MarketPrice.timestamp >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(MarketPrice.timestamp < datetime.combine(end_date.fromordinal(end_date.toordinal() + 1), datetime.min.time()))
    return query.order_by(MarketPrice.timestamp.asc()).limit(limit).all()


@router.get("/{price_id}", response_model=MarketPriceRead)
def get_price(price_id: int, db: Session = Depends(get_db)):
    record = db.get(MarketPrice, price_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Price record not found")
    return record


@router.post("", response_model=MarketPriceRead, status_code=status.HTTP_201_CREATED)
def create_price(payload: MarketPriceCreate, db: Session = Depends(get_db)):
    record = MarketPrice(**payload.model_dump(), region=payload.region.upper())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/import-csv", tags=["Data ingestion"])
async def import_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    raw = await file.read()
    try:
        frame = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not read CSV file") from exc

    required = {"timestamp", "region", "price_eur_mwh"}
    if not required.issubset(set(frame.columns)):
        missing = sorted(required - set(frame.columns))
        raise HTTPException(status_code=400, detail=f"Missing required CSV columns: {', '.join(missing)}")

    created = 0
    errors = []
    for row_number, row in frame.iterrows():
        try:
            timestamp = pd.to_datetime(row["timestamp"], errors="raise").to_pydatetime()
            region = str(row["region"]).strip().upper()
            price = float(row["price_eur_mwh"])
            if not region or len(region) > 10:
                raise ValueError("region must be 1–10 characters")
            if not pd.notna(price):
                raise ValueError("price must be a number")
            source = str(row.get("source", "csv-import"))
            db.add(MarketPrice(
                timestamp=timestamp,
                region=region,
                price_eur_mwh=price,
                source=source[:100],
            ))
            created += 1
        except Exception as exc:
            errors.append({"row": int(row_number) + 2, "error": str(exc)})

    if created:
        db.commit()
    else:
        db.rollback()

    return {"created": created, "rejected": len(errors), "errors": errors[:20]}
