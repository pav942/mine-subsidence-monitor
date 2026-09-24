import requests
import random
import time
from datetime import datetime, timezone

import os

BACKEND_URL = os.environ.get(
    "BACKEND_URL",
    "https://mine-subsidence-monitor.onrender.com"
)

SEND_INTERVAL_SECONDS = 5  # how often each cycle sends readings

# All 20 nodes now come from this simulator. NODE_01 and NODE_02 sit at the
# real PSNA College hardware install positions (previously fed by the ESP32
# LoRa gateway via /ingest); NODE_03-NODE_20 are scattered along the
# PSNA College -> Dindigul bypass corridor (~10 km), clustered/jittered
# rather than an exact straight line. SYNTHETIC / PROTOTYPE DATA ONLY.

nodes = [
    {"node_id": "NODE_01", "latitude": 10.4165,   "longitude": 77.9005,   "drift_stage": 0, "is_drifting": False},
    {"node_id": "NODE_02", "latitude": 10.416800, "longitude": 77.900800, "drift_stage": 0, "is_drifting": True},

    {"node_id": "NODE_03", "latitude": 10.412831, "longitude": 77.908505, "drift_stage": 0, "is_drifting": False},
    {"node_id": "NODE_04", "latitude": 10.411242, "longitude": 77.909435, "drift_stage": 0, "is_drifting": False},
    {"node_id": "NODE_05", "latitude": 10.410085, "longitude": 77.909761, "drift_stage": 0, "is_drifting": False},
    {"node_id": "NODE_06", "latitude": 10.408912, "longitude": 77.910139, "drift_stage": 0, "is_drifting": False},

    {"node_id": "NODE_07", "latitude": 10.402497, "longitude": 77.919400, "drift_stage": 0, "is_drifting": True},

    {"node_id": "NODE_08", "latitude": 10.398825, "longitude": 77.931454, "drift_stage": 0, "is_drifting": False},
    {"node_id": "NODE_09", "latitude": 10.397484, "longitude": 77.931727, "drift_stage": 0, "is_drifting": False},
    {"node_id": "NODE_10", "latitude": 10.395969, "longitude": 77.931895, "drift_stage": 0, "is_drifting": False},

    {"node_id": "NODE_11", "latitude": 10.393932, "longitude": 77.940845, "drift_stage": 0, "is_drifting": False},

    {"node_id": "NODE_12", "latitude": 10.386091, "longitude": 77.945629, "drift_stage": 0, "is_drifting": True},

    {"node_id": "NODE_13", "latitude": 10.383725, "longitude": 77.955184, "drift_stage": 0, "is_drifting": False},
    {"node_id": "NODE_14", "latitude": 10.382467, "longitude": 77.955510, "drift_stage": 0, "is_drifting": False},
    {"node_id": "NODE_15", "latitude": 10.381294, "longitude": 77.955988, "drift_stage": 0, "is_drifting": False},
    {"node_id": "NODE_16", "latitude": 10.380121, "longitude": 77.956266, "drift_stage": 0, "is_drifting": False},

    {"node_id": "NODE_17", "latitude": 10.378843, "longitude": 77.965390, "drift_stage": 0, "is_drifting": False},

    {"node_id": "NODE_18", "latitude": 10.372182, "longitude": 77.970594, "drift_stage": 0, "is_drifting": True},

    {"node_id": "NODE_19", "latitude": 10.370516, "longitude": 77.976177, "drift_stage": 0, "is_drifting": False},
    {"node_id": "NODE_20", "latitude": 10.368502, "longitude": 77.976636, "drift_stage": 0, "is_drifting": False},
]


def generate_reading(node):
    """
    Generates one sensor reading for a node.
    Most readings are normal noise around a baseline.
    Nodes marked is_drifting slowly increase their drift_stage over time,
    simulating progressive deformation: normal -> small increase -> anomaly -> high risk.
    """
    if node["is_drifting"]:
        node["drift_stage"] = min(node["drift_stage"] + random.uniform(0, 0.8), 100)
    else:
        if random.random() < 0.02:
            node["drift_stage"] = random.uniform(20, 40)
        else:
            node["drift_stage"] = max(node["drift_stage"] * 0.9, 0)

    drift = node["drift_stage"]

    tilt = round(0.1 + (drift / 100) * 5 + random.uniform(-0.05, 0.05), 3)
    vibration = round(0.05 + (drift / 100) * 2 + random.uniform(-0.02, 0.02), 3)
    displacement = round(0.5 + (drift / 100) * 15 + random.uniform(-0.1, 0.1), 3)
    crack = 1 if drift > 85 and random.random() < 0.3 else 0

    return {
        "node_id": node["node_id"],
        "latitude": node["latitude"],
        "longitude": node["longitude"],
        "tilt": max(tilt, 0),
        "vibration": max(vibration, 0),
        "displacement": max(displacement, 0),
        "crack": crack,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def send_reading(reading):
    try:
        response = requests.post(BACKEND_URL, json=reading, timeout=10)
        if response.status_code == 200:
            print(f"[OK] {reading['node_id']} -> tilt={reading['tilt']} "
                  f"disp={reading['displacement']} vib={reading['vibration']} "
                  f"crack={reading['crack']}")
        else:
            print(f"[ERROR] {reading['node_id']} -> {response.status_code}: {response.text}")
    except requests.exceptions.ConnectionError:
        print("[ERROR] Could not connect to backend. Is uvicorn running on port 8000?")
    except requests.exceptions.ReadTimeout:
        print(f"[ERROR] {reading['node_id']} -> Backend took too long to respond (timed out).")


def main():
    print("=" * 60)
    print("Mine Subsidence Monitor - SENSOR SIMULATOR")
    print("SYNTHETIC / PROTOTYPE DEMONSTRATION DATA ONLY")
    print(f"Simulating all {len(nodes)} nodes (NODE_01-NODE_20), sending every {SEND_INTERVAL_SECONDS}s")
    print("ESP32 hardware/LoRa gateway is no longer used as a data source")
    print("Press Ctrl+C to stop")
    print("=" * 60)

    try:
        while True:
            for node in nodes:
                reading = generate_reading(node)
                send_reading(reading)
            time.sleep(SEND_INTERVAL_SECONDS)
    except KeyboardInterrupt:
        print("\nSimulator stopped.")


if __name__ == "__main__":
    main()