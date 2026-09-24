from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from app.database import get_db
from app import models, schemas
from app.services.ingestion_service import process_reading

router = APIRouter()


@router.post("/sensor-data")
def receive_sensor_data(data: schemas.SensorDataIn, db: Session = Depends(get_db)):
    result = process_reading(
        db=db,
        node_id=data.node_id,
        latitude=data.latitude,
        longitude=data.longitude,
        tilt=data.tilt,
        vibration=data.vibration,
        displacement=data.displacement,
        crack=data.crack,
        timestamp=data.timestamp,
    )
    return {
        "status": "success",
        "reading_id": result["reading_id"],
        "anomaly_status": result["anomaly_status"],
        "risk_score": result["risk_score"],
        "risk_level": result["risk_level"],
    }


@router.get("/sensors", response_model=List[schemas.SensorNodeOut])
def get_all_sensors(db: Session = Depends(get_db)):
    return db.query(models.SensorNode).all()


@router.get("/sensor/{node_id}", response_model=schemas.SensorNodeOut)
def get_sensor(node_id: str, db: Session = Depends(get_db)):
    node = db.query(models.SensorNode).filter(
        models.SensorNode.node_id == node_id
    ).first()
    if not node:
        raise HTTPException(status_code=404, detail="Sensor node not found")
    return node


@router.get("/history/{node_id}", response_model=List[schemas.SensorReadingOut])
def get_history(node_id: str, limit: int = 100, db: Session = Depends(get_db)):
    readings = (
        db.query(models.SensorReading)
        .filter(models.SensorReading.node_id == node_id)
        .order_by(desc(models.SensorReading.timestamp))
        .limit(limit)
        .all()
    )
    return readings


@router.get("/risk", response_model=List[schemas.RiskResultOut])
def get_all_risk(db: Session = Depends(get_db)):
    return (
        db.query(models.RiskResult)
        .order_by(desc(models.RiskResult.timestamp))
        .limit(200)
        .all()
    )


@router.get("/alerts", response_model=List[schemas.AlertOut])
def get_alerts(db: Session = Depends(get_db)):
    return (
        db.query(models.Alert)
        .order_by(desc(models.Alert.timestamp))
        .limit(100)
        .all()
    )