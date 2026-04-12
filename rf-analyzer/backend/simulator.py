import uuid
from datetime import datetime, timezone

import numpy as np

SCENARIOS = {
    "peacekeeping":    {"friendly": 0.90, "unknown": 0.08, "hostile": 0.02},
    "border_patrol":   {"friendly": 0.60, "unknown": 0.25, "hostile": 0.15},
    "active_conflict": {"friendly": 0.45, "unknown": 0.30, "hostile": 0.25},
}

CLASSES = ["friendly", "unknown", "hostile"]


class SignalGenerator:
    def __init__(self, rng: np.random.Generator | None = None):
        self.rng = rng or np.random.default_rng()

    def _pick_class(self, scenario: str) -> str:
        weights = SCENARIOS[scenario]
        probs = [weights["friendly"], weights["unknown"], weights["hostile"]]
        return self.rng.choice(CLASSES, p=probs)

    def generate(self, scenario: str = "active_conflict") -> dict:
        cls = self._pick_class(scenario)

        if cls == "friendly":
            freq_center   = self.rng.uniform(130, 320)          # overlaps unknown 250–320
            power_dbm     = float(np.clip(self.rng.normal(-70, 8),  -95, -30))
            bandwidth_khz = float(np.clip(self.rng.normal(15, 5),     2,  60))
            duration_ms   = max(1, int(self.rng.normal(120, 30)))
            modulation    = self.rng.choice(["AM", "FM"], p=[0.6, 0.4])
            freq_hop_flag = 0 if self.rng.random() < 0.95 else 1
            burst_reg     = float(np.clip(self.rng.normal(0.80, 0.15), 0.0, 1.0))

        elif cls == "unknown":
            freq_center   = self.rng.uniform(250, 700)          # overlaps friendly 250–320, hostile 500–700
            power_dbm     = float(np.clip(self.rng.normal(-60, 10), -95, -20))
            bandwidth_khz = float(np.clip(self.rng.normal(30, 12),    2, 120))
            duration_ms   = max(1, int(self.rng.normal(200, 60)))
            modulation    = self.rng.choice(["AM", "FM", "PSK"], p=[0.3, 0.4, 0.3])
            freq_hop_flag = 0 if self.rng.random() < 0.85 else 1
            burst_reg     = float(np.clip(self.rng.normal(0.50, 0.20), 0.0, 1.0))

        else:  # hostile
            freq_center   = self.rng.uniform(500, 4000)         # overlaps unknown 500–700
            power_dbm     = float(np.clip(self.rng.normal(-42, 10), -80, -10))
            bandwidth_khz = float(np.clip(self.rng.normal(80, 25),    5, 300))
            duration_ms   = max(1, int(self.rng.normal(80, 25)))
            modulation    = self.rng.choice(["PSK", "QAM"], p=[0.5, 0.5])
            freq_hop_flag = 1 if self.rng.random() < 0.85 else 0
            burst_reg     = float(np.clip(self.rng.normal(0.20, 0.15), 0.0, 1.0))

        # Gaussian noise on frequency
        frequency_mhz = round(float(freq_center + self.rng.normal(0, 2)), 3)

        return {
            # --- WebSocket schema fields ---
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "frequency_mhz": frequency_mhz,
            "power_dbm": round(power_dbm, 2),
            "bandwidth_khz": round(bandwidth_khz, 2),
            "modulation": str(modulation),
            "duration_ms": duration_ms,
            "label": cls,
            "confidence": None,    # filled in by classifier
            "threat_score": None,  # filled in by scorer
            # --- ML-only features (stripped before WebSocket send) ---
            "freq_hop_flag": int(freq_hop_flag),
            "burst_regularity": round(burst_reg, 4),
        }
