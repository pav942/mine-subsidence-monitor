import os
import joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "model.pkl")

_model = None
_model_load_attempted = False


def get_model():
    """Lazily loads the trained Isolation Forest. Returns None if not trained yet."""
    global _model, _model_load_attempted
    if _model is None and not _model_load_attempted:
        _model_load_attempted = True
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
            print(f"[AI] Model loaded from {MODEL_PATH}")
        else:
            print("[AI] No trained model found yet. Run ml/train_model.py first. "
                  "Readings will be stored without anomaly scoring until then.")
    return _model


def score_reading(tilt, vibration, displacement, crack_status, previous_displacement):
    """
    Returns "anomaly" or "normal" for a single reading.
    Returns None if no model is trained yet (caller should skip risk scoring).
    """
    model = get_model()
    if model is None:
        return None

    rate_of_change = displacement - previous_displacement if previous_displacement is not None else 0

    features = np.array([[tilt, vibration, displacement, crack_status, rate_of_change]])
    prediction = model.predict(features)[0]  # -1 = anomaly, 1 = normal

    return "anomaly" if prediction == -1 else "normal"