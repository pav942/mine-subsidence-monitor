from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ---------- Incoming sensor data (from simulator or later ESP32) ----------
class SensorDataIn(BaseModel):
    node_id: str
    latitude: float
    longitude: float
    tilt: float
    vibration: float
    displacement: float
    crack: int = 0
    timestamp: Optional[datetime] = None


# ---------- Sensor node info ----------
class SensorNodeOut(BaseModel):
    id: int
    node_id: str
    latitude: float
    longitude: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Individual reading ----------
class SensorReadingOut(BaseModel):
    id: int
    node_id: str
    timestamp: datetime
    tilt: float
    vibration: float
    displacement: float
    crack_status: int

    class Config:
        from_attributes = True


# ---------- Risk result ----------
class RiskResultOut(BaseModel):
    id: int
    node_id: str
    timestamp: datetime
    anomaly_status: str
    risk_score: float
    risk_level: str

    class Config:
        from_attributes = True


# ---------- Alert ----------
class AlertOut(BaseModel):
    id: int
    node_id: str
    timestamp: datetime
    alert_type: str
    message: str
    severity: str
    status: str

    class Config:
        from_attributes = True