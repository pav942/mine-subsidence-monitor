import sqlite3
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os

# Path to the backend's SQLite DB (ml/ and backend/ are sibling folders)
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "mine_monitor.db")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

FEATURES = ["tilt", "vibration", "displacement", "crack_status", "rate_of_change"]


def load_readings():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query(
        "SELECT node_id, timestamp, tilt, vibration, displacement, crack_status "
        "FROM sensor_readings ORDER BY node_id, timestamp",
        conn,
    )
    conn.close()
    return df


def engineer_features(df):
    # rate_of_change = change in displacement from the previous reading, per node
    df["rate_of_change"] = df.groupby("node_id")["displacement"].diff().fillna(0)
    return df


def train():
    print("Loading readings from database...")
    df = load_readings()

    if len(df) < 50:
        print(f"Only {len(df)} readings found. Let the simulator run longer "
              f"(need at least ~50, ideally 200+) before training.")
        return

    df = engineer_features(df)
    X = df[FEATURES].values

    print(f"Training Isolation Forest on {len(X)} readings...")
    # contamination=0.1 means we expect ~10% of readings to be anomalous —
    # a reasonable starting assumption given the simulator's drifting nodes.
    model = IsolationForest(
        n_estimators=150,
        contamination=0.1,
        random_state=42,
    )
    model.fit(X)

    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

    # Quick sanity check on the training data itself
    predictions = model.predict(X)  # -1 = anomaly, 1 = normal
    anomaly_count = (predictions == -1).sum()
    print(f"On training data: {anomaly_count} / {len(X)} flagged as anomalies "
          f"({anomaly_count / len(X) * 100:.1f}%)")


if __name__ == "__main__":
    train()