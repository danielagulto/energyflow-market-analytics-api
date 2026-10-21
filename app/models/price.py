from sqlalchemy import Column, DateTime, Float, Integer, String, Index

from app.db.database import Base


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    region = Column(String(10), nullable=False, index=True)
    price_eur_mwh = Column(Float, nullable=False)
    source = Column(String(100), nullable=False, default="unknown")

    __table_args__ = (
        Index("ix_market_prices_region_timestamp", "region", "timestamp"),
    )
