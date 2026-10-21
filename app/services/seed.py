from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.price import MarketPrice


def seed_if_empty(db: Session) -> None:
    if db.query(MarketPrice).count() > 0:
        return

    # Clearly illustrative sample values for API demonstration only.
    base = datetime(2026, 10, 20, 0, 0)
    sample_prices = [72.4, 68.9, 64.2, 61.8, 63.1, 70.5, 85.7, 96.2,
                     88.6, 79.3, 75.4, 73.8, 77.1, 82.5, 91.2, 98.4,
                     94.1, 87.6, 83.2, 79.8, 76.3, 74.9, 71.5, 69.7]
    for hour, price in enumerate(sample_prices):
        db.add(MarketPrice(
            timestamp=base + timedelta(hours=hour),
            region="ES",
            price_eur_mwh=price,
            source="illustrative-sample",
        ))
    db.commit()
