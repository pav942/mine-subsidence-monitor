from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.services.fukuzono_service import compute_fukuzono

router = APIRouter()


@router.get("/fukuzono/{node_id}")
def get_fukuzono_analysis(node_id: str, limit: int = 50, db: Session = Depends(get_db)):
    readings = (
        db.query(models.SensorReading)
        .filter(models.SensorReading.node_id == node_id)
        .order_by(models.SensorReading.timestamp.asc())
        .all()
    )

    if not readings:
        raise HTTPException(status_code=404, detail="No readings found for this node")

    # Keep only the most recent `limit` readings, oldest -> newest
    readings = readings[-limit:]

    series, predicted_failure_time = compute_fukuzono(readings)

    return {
        "node_id": node_id,
        "method": "Fukuzono Inverse Velocity Method",
        "readings_used": len(readings),
        "series": series,
        "predicted_failure_time": predicted_failure_time,
        "note": "Prototype estimate based on limited/synthetic data — not a validated failure-time prediction.",
    }