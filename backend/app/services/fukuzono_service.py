import numpy as np
from datetime import timedelta


def compute_fukuzono(readings):
    """
    readings: list of SensorReading ORM objects, sorted OLDEST -> NEWEST.
    Applies Fukuzono's (1985) Inverse Velocity Method:
      - velocity = change in displacement / change in time, between consecutive readings
      - inverse_velocity = 1 / velocity
      - if inverse_velocity trends linearly toward zero, extrapolating that line
        to y=0 gives an estimated failure time.

    Returns (series, predicted_failure_time_iso_or_None)
    """
    if len(readings) < 3:
        return [], None

    t0 = readings[0].timestamp
    series = []
    valid_times = []
    valid_inv_velocities = []

    for i in range(1, len(readings)):
        dt = (readings[i].timestamp - readings[i - 1].timestamp).total_seconds()
        if dt <= 0:
            continue

        dv = readings[i].displacement - readings[i - 1].displacement
        velocity = dv / dt  # displacement units per second

        inverse_velocity = None
        if velocity > 1e-6:  # only meaningful for genuine positive movement
            inverse_velocity = 1.0 / velocity

        t_seconds = (readings[i].timestamp - t0).total_seconds()

        series.append({
            "timestamp": readings[i].timestamp.isoformat(),
            "t_seconds": round(t_seconds, 1),
            "velocity": round(velocity, 6),
            "inverse_velocity": round(inverse_velocity, 5) if inverse_velocity is not None else None,
        })

        if inverse_velocity is not None:
            valid_times.append(t_seconds)
            valid_inv_velocities.append(inverse_velocity)

    predicted_failure_time = None
    if len(valid_times) >= 3:
        # Fit a straight line: inverse_velocity = m * t + c
        m, c = np.polyfit(valid_times, valid_inv_velocities, 1)

        # A negative slope means inverse velocity is falling toward zero —
        # i.e. velocity is accelerating. That's the classic Fukuzono signature.
        if m < 0:
            t_failure_seconds = -c / m
            if t_failure_seconds > valid_times[-1]:
                predicted_failure_time = (t0 + timedelta(seconds=t_failure_seconds)).isoformat()

    return series, predicted_failure_time