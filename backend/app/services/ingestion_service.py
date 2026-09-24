from datetime import datetime
from sqlalchemy.orm import Session
from app import models
from app.services.ai_scorer import score_reading
from app.services.risk_scorer import compute_risk_score
from app.services.alert_service import maybe_create_alert


def process_reading(db: Session, node_id: str, latitude: float, longitude: float,
                     tilt: float, vibration: float, displacement: float,
                     crack: int, timestamp=None):
    """
    Shared ingestion pipeline used by BOTH /sensor-data (direct-WiFi ESP32 /
    simulator) and /ingest (LoRa gateway). Registers/updates the node, stores
    the reading, runs AI anomaly scoring, computes the risk score, and
    triggers alerts — identical logic regardless of which endpoint called it.
    """
    node = db.query(models.SensorNode).filter(
        models.SensorNode.node_id == node_id
    ).first()

    if not node:
        node = models.SensorNode(
            node_id=node_id,
            latitude=latitude,
            longitude=longitude,
            status="online",
        )
        db.add(node)
        db.commit()
        db.refresh(node)
    else:
        node.status = "online"
        node.latitude = latitude
        node.longitude = longitude
        db.commit()

    previous_reading = (
        db.query(models.SensorReading)
        .filter(models.SensorReading.node_id == node_id)
        .order_by(models.SensorReading.timestamp.desc())
        .first()
    )
    previous_displacement = previous_reading.displacement if previous_reading else None

    reading_timestamp = timestamp or datetime.utcnow()

    reading = models.SensorReading(
        node_id=node_id,
        timestamp=reading_timestamp,
        tilt=tilt,
        vibration=vibration,
        displacement=displacement,
        crack_status=crack,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    anomaly_status = score_reading(
        tilt=tilt,
        vibration=vibration,
        displacement=displacement,
        crack_status=crack,
        previous_displacement=previous_displacement,
    )

    rate_of_change = displacement - previous_displacement if previous_displacement is not None else 0

    risk_score, risk_level = compute_risk_score(
        tilt=tilt,
        vibration=vibration,
        displacement=displacement,
        crack_status=crack,
        rate_of_change=rate_of_change,
        anomaly_status=anomaly_status,
    )

    risk_result = models.RiskResult(
        node_id=node_id,
        timestamp=reading.timestamp,
        anomaly_status=anomaly_status or "unscored",
        risk_score=risk_score,
        risk_level=risk_level,
    )
    db.add(risk_result)
    db.commit()

    maybe_create_alert(
        db=db,
        node_id=node_id,
        risk_score=risk_score,
        risk_level=risk_level,
        crack_status=crack,
        timestamp=reading.timestamp,
    )

    return {
        "reading_id": reading.id,
        "anomaly_status": anomaly_status,
        "risk_score": risk_score,
        "risk_level": risk_level,
    }