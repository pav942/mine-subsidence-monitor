# Prototype / demonstration risk scoring.
# Weights and thresholds below are NOT scientifically validated mine-safety
# values — they are transparent, tunable placeholders for this SIH prototype.

# Synthetic "reasonable max" values used to normalize each sensor to a 0-100 scale.
# Tuned to roughly match the simulator's drift range (see simulator/simulate.py).
MAX_TILT = 5.0
MAX_DISPLACEMENT = 15.0
MAX_VIBRATION = 2.0
MAX_RATE_OF_CHANGE = 3.0

WEIGHTS = {
    "tilt": 0.25,
    "displacement": 0.30,
    "vibration": 0.20,
    "rate_of_change": 0.15,
    "crack": 0.10,
}

ANOMALY_BOOST = 15  # extra points added if the AI flagged this reading as anomalous


def _normalize(value, max_value):
    """Clamp a raw value to a 0-100 scale based on a synthetic reasonable max."""
    if value is None:
        return 0
    scaled = (value / max_value) * 100
    return max(0, min(scaled, 100))


def compute_risk_score(tilt, vibration, displacement, crack_status, rate_of_change, anomaly_status):
    tilt_score = _normalize(tilt, MAX_TILT)
    displacement_score = _normalize(displacement, MAX_DISPLACEMENT)
    vibration_score = _normalize(vibration, MAX_VIBRATION)
    rate_score = _normalize(abs(rate_of_change or 0), MAX_RATE_OF_CHANGE)
    crack_score = 100 if crack_status else 0

    weighted = (
        tilt_score * WEIGHTS["tilt"]
        + displacement_score * WEIGHTS["displacement"]
        + vibration_score * WEIGHTS["vibration"]
        + rate_score * WEIGHTS["rate_of_change"]
        + crack_score * WEIGHTS["crack"]
    )

    if anomaly_status == "anomaly":
        weighted += ANOMALY_BOOST

    final_score = round(max(0, min(weighted, 100)), 1)

    if final_score <= 30:
        risk_level = "SAFE"
    elif final_score <= 70:
        risk_level = "WARNING"
    else:
        risk_level = "CRITICAL"

    return final_score, risk_level