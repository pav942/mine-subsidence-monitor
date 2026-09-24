import sqlite3
import pandas as pd
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "mine_monitor.db")

METRICS = ["tilt", "vibration", "displacement", "risk_score"]


def compute_correlation_matrix():
    """
    Joins sensor_readings with risk_results on (node_id, timestamp) — these
    match exactly since risk_result.timestamp is always set to reading.timestamp
    at ingestion time. Computes a Pearson correlation matrix across
    tilt, vibration, displacement, and risk_score.
    """
    conn = sqlite3.connect(DB_PATH)
    query = """
        SELECT r.node_id, r.timestamp, r.tilt, r.vibration, r.displacement, k.risk_score
        FROM sensor_readings r
        LEFT JOIN risk_results k
          ON r.node_id = k.node_id AND r.timestamp = k.timestamp
    """
    df = pd.read_sql_query(query, conn)
    conn.close()

    df = df.dropna(subset=METRICS)

    if len(df) < 3:
        return None

    corr = df[METRICS].corr(method="pearson")
    return corr.round(3).to_dict()