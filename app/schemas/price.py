from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MarketPriceCreate(BaseModel):
    timestamp: datetime
    region: str = Field(min_length=2, max_length=10, examples=["ES"])
    price_eur_mwh: float = Field(ge=-1000, le=100000, description="Price in euros per MWh")
    source: str = Field(default="manual-entry", min_length=1, max_length=100)

    @field_validator("region")
    @classmethod
    def normalize_region(cls, value: str) -> str:
        return value.strip().upper()


class MarketPriceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    region: str
    price_eur_mwh: float
    source: str
