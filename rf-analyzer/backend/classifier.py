"""
Module-level classify() function used by main.py.
Features must match train.py exactly:
  frequency_mhz, power_dbm, bandwidth_khz, duration_ms,
  freq_hop_flag, burst_regularity,
  mod_AM, mod_FM, mod_PSK, mod_QAM
"""

import os
import numpy as np
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
MOD_COLS = ["AM", "FM", "PSK", "QAM"]
LABELS = ["friendly", "unknown", "hostile"]

_model = None


def _load_model():
    global _model
    if _model is not None:
        return _model
    if not os.path.exists(MODEL_PATH):
        # Auto-train if model is missing
        from train import main as train_main
        train_main()
    _model = joblib.load(MODEL_PATH)
    return _model


def _featurize(signal: dict) -> np.ndarray:
    mod_oh = [1.0 if signal["modulation"] == m else 0.0 for m in MOD_COLS]
    return np.array([
        signal["frequency_mhz"],
        signal["power_dbm"],
        signal["bandwidth_khz"],
        float(signal["duration_ms"]),
        float(signal["freq_hop_flag"]),
        signal["burst_regularity"],
        *mod_oh,
    ]).reshape(1, -1)


def classify(signal: dict) -> dict:
    """Return {"label": str, "confidence": float 0-1}."""
    model = _load_model()
    x = _featurize(signal)
    pred = int(model.predict(x)[0])
    proba = model.predict_proba(x)[0]
    label = LABELS[pred]
    confidence = round(float(proba[pred]), 3)
    return {"label": label, "confidence": confidence}
