from sqlalchemy.orm import Session
from app import models
from app.services.notifier import send_critical_alert_email


def maybe_create_alert(db: Session, node_id: str, risk_score: float, risk_level: str,
                        crack_status: int, timestamp):
    """
    Creates a new Alert row only when this node's severity has changed
    since its last alert (prevents spamming an alert every few seconds).
    SAFE readings never generate alerts. CRITICAL alerts also trigger
    an email/SMS-gateway notification (with its own cooldown).
    """
    if risk_level == "SAFE" and not crack_status:
        return None

    last_alert = (
        db.query(models.Alert)
        .filter(models.Alert.node_id == node_id)
        .order_by(models.Alert.timestamp.desc())
        .first()
    )

    if last_alert and last_alert.severity == risk_level and last_alert.status == "active":
        if not (crack_status and "Crack" not in last_alert.alert_type):
            return None

    if crack_status:
        alert_type = "Crack Detected"
        message = f"Crack sensor triggered on {node_id}. Risk score: {risk_score}%."
    elif risk_level == "CRITICAL":
        alert_type = "Critical Subsidence Risk"
        message = f"{node_id} risk score reached {risk_score}% — possible abnormal deformation."
    else:
        alert_type = "Rising Subsidence Risk"
        message = f"{node_id} risk score reached {risk_score}% — trending upward."

    alert = models.Alert(
        node_id=node_id,
        timestamp=timestamp,
        alert_type=alert_type,
        message=message,
        severity=risk_level,
        status="active",
    )
    db.add(alert)
    db.commit()

    if risk_level == "CRITICAL":
        send_critical_alert_email(node_id=node_id, risk_score=risk_score, message=message)

    return alert