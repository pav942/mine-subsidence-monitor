import math
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.services.ingestion_service import process_reading

router = APIRouter()

# Fixed physical coordinates per LoRa node name.
# Update these to the real install locations of Node 1 / Node 2 if different.
NODE_LOCATIONS = {
    "node1": {"node_id": "NODE_01", "latitude": 10.4165, "longitude": 77.9005},
    "node2": {"node_id": "NODE_02", "latitude": 10.41653, "longitude": 77.90053},
}

# In-memory cumulative displacement estimate per node (resets if backend restarts).
# These sensors don't measure true displacement directly — this is a transparent,
# documented ESTIMATE derived from tilt. Prototype approximation only.
_cumulative_displacement = {"node1": 0.0, "node2": 0.0}


class Sample(BaseModel):
    AX: float
    AY: float
    AZ: float
    VX: float
    VY: float
    VZ: float


class IngestPayload(BaseModel):
    node_name: str
    samples: List[Sample]
    rssi: Optional[float] = None


def _derive_tilt_degrees(samples: List[Sample]) -> float:
    angles = []
    for s in samples:
        az = s.AZ if s.AZ != 0 else 0.0001
        angle = math.atan2(math.sqrt(s.AX ** 2 + s.AY ** 2), az)
        angles.append(math.degrees(angle))
    return sum(angles) / len(angles)


def _derive_vibration(samples: List[Sample]) -> float:
    magnitudes = [math.sqrt(s.VX ** 2 + s.VY ** 2 + s.VZ ** 2) for s in samples]
    mean = sum(magnitudes) / len(magnitudes)
    variance = sum((m - mean) ** 2 for m in magnitudes) / len(magnitudes)
    std = math.sqrt(variance)
    # Raw vibration-sensor values sit on a much larger scale than this system's
    # 0-2 "vibration" unit — this divisor is a tunable prototype normalization,
    # not a calibrated physical conversion.
    return std / 1000.0


@router.post("/ingest")
def ingest_lora_window(payload: IngestPayload, db: Session = Depends(get_db)):
    node_name = payload.node_name

    if node_name not in NODE_LOCATIONS or len(payload.samples) == 0:
        return {"status": "error", "message": "Unknown node_name or empty samples"}

    location = NODE_LOCATIONS[node_name]

    tilt = _derive_tilt_degrees(payload.samples)
    vibration = _derive_vibration(payload.samples)

    _cumulative_displacement[node_name] = min(
        _cumulative_displacement.get(node_name, 0.0) + (tilt / 90.0) * 0.05,
        20.0,
    )
    displacement = _cumulative_displacement[node_name]

    crack = 0  # no crack sensor on this hardware

    result = process_reading(
        db=db,
        node_id=location["node_id"],
        latitude=location["latitude"],
        longitude=location["longitude"],
        tilt=tilt,
        vibration=vibration,
        displacement=displacement,
        crack=crack,
    )

    label_map = {"SAFE": "normal", "WARNING": "warning", "CRITICAL": "critical"}

    return {
        "status": "predicted",
        "prediction_completed": True,
        "label": label_map.get(result["risk_level"], "normal"),
        "confidence": round(result["risk_score"] / 100, 2),
    }