from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class SensorNode(Base):
    __tablename__ = "sensor_nodes"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String, default="unknown")  # online / offline / unknown
    created_at = Column(DateTime, default=datetime.utcnow)

    readings = relationship("SensorReading", back_populates="node")
    risk_results = relationship("RiskResult", back_populates="node")
    alerts = relationship("Alert", back_populates="node")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, ForeignKey("sensor_nodes.node_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    tilt = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    displacement = Column(Float, nullable=False)
    crack_status = Column(Integer, default=0)  # 0 = no crack, 1 = crack detected

    node = relationship("SensorNode", back_populates="readings")


class RiskResult(Base):
    __tablename__ = "risk_results"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, ForeignKey("sensor_nodes.node_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    anomaly_status = Column(String, default="normal")  # normal / anomaly
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String, default="SAFE")  # SAFE / WARNING / CRITICAL

    node = relationship("SensorNode", back_populates="risk_results")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, ForeignKey("sensor_nodes.node_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    alert_type = Column(String, nullable=False)
    message = Column(String, nullable=False)
    severity = Column(String, default="LOW")  # LOW / MEDIUM / HIGH / CRITICAL
    status = Column(String, default="active")  # active / acknowledged / resolved

    node = relationship("SensorNode", back_populates="alerts")