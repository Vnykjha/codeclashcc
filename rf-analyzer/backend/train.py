"""
Train a RandomForestClassifier on synthetic RF signals and save to model.pkl.

Features:
  frequency_mhz, power_dbm, bandwidth_khz, duration_ms,
  freq_hop_flag, burst_regularity,
  mod_AM, mod_FM, mod_PSK, mod_QAM  (one-hot)

Labels: 0=friendly, 1=unknown, 2=hostile
"""

import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

from simulator import SignalGenerator

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
LABEL_MAP = {"friendly": 0, "unknown": 1, "hostile": 2}
MOD_COLS = ["AM", "FM", "PSK", "QAM"]
N_SIGNALS = 2000  # per class → 6000 total


def extract_features(signal: dict) -> list[float]:
    mod_oh = [1.0 if signal["modulation"] == m else 0.0 for m in MOD_COLS]
    return [
        signal["frequency_mhz"],
        signal["power_dbm"],
        signal["bandwidth_khz"],
        signal["duration_ms"],
        signal["freq_hop_flag"],
        signal["burst_regularity"],
        *mod_oh,
    ]


def generate_dataset(n_per_class: int = N_SIGNALS):
    # Use active_conflict scenario and override to get balanced classes
    # by generating directly with forced class labels via scenario manipulation.
    # Simplest: generate from all-hostile / all-friendly / all-unknown scenarios.
    gen = SignalGenerator(rng=np.random.default_rng(0))

    # Temporary single-class scenarios
    from simulator import SCENARIOS
    orig = dict(SCENARIOS)
    SCENARIOS["_friendly_only"] = {"friendly": 1.0, "unknown": 0.0, "hostile": 0.0}
    SCENARIOS["_unknown_only"]  = {"friendly": 0.0, "unknown": 1.0, "hostile": 0.0}
    SCENARIOS["_hostile_only"]  = {"friendly": 0.0, "unknown": 0.0, "hostile": 1.0}

    X, y = [], []
    for scenario, label in [
        ("_friendly_only", 0),
        ("_unknown_only",  1),
        ("_hostile_only",  2),
    ]:
        for _ in range(n_per_class):
            sig = gen.generate(scenario=scenario)
            X.append(extract_features(sig))
            y.append(label)

    # Clean up temporary scenarios
    for key in ["_friendly_only", "_unknown_only", "_hostile_only"]:
        del SCENARIOS[key]

    return np.array(X), np.array(y)


def main():
    print(f"Generating {N_SIGNALS * 3} signals ({N_SIGNALS} per class)...")
    X, y = generate_dataset(N_SIGNALS)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training RandomForestClassifier(n_estimators=100, random_state=42)...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    print("\nClassification Report:")
    print(classification_report(
        y_test, y_pred,
        target_names=["friendly", "unknown", "hostile"],
        digits=4,
    ))

    joblib.dump(clf, MODEL_PATH)
    print(f"Model saved → {MODEL_PATH}")


if __name__ == "__main__":
    main()
