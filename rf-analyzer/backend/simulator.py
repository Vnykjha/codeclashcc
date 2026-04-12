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

    def _gaussian_noise(self, value: float, std: float = 2.0) -> float:
        return value + self.rng.normal(0, std)

    def generate(self, scenario: str = "active_conflict") -> dict:
        cls = self._pick_class(scenario)

        if cls == "friendly":
            freq_center = self.rng.uniform(136, 174)
            power_center = self.rng.uniform(-80, -60)
            bw = self.rng.uniform(10, 30)
            duration = int(self.rng.normal(500, 80))
            modulation = self.rng.choice(["AM", "FM"])
            freq_hop_flag = 0
            burst_regularity = float(np.clip(self.rng.normal(0.85, 0.08), 0.0, 1.0))

        elif cls == "unknown":
            freq_center = self.rng.uniform(300, 512)
            power_center = self.rng.uniform(-70, -50)
            bw = self.rng.uniform(20, 100)
            duration = int(self.rng.normal(200, 100))
            modulation = self.rng.choice(["AM", "FM", "PSK", "QAM"])
            freq_hop_flag = 0
            burst_regularity = float(np.clip(self.rng.normal(0.50, 0.15), 0.0, 1.0))

        else:  # hostile
            freq_center = self.rng.uniform(2000, 4000)
            power_center = self.rng.uniform(-55, -30)
            bw = self.rng.uniform(100, 500)
            duration = int(self.rng.normal(50, 20))
            modulation = self.rng.choice(["PSK", "QAM"])
            freq_hop_flag = 1
            burst_regularity = float(np.clip(self.rng.normal(0.15, 0.08), 0.0, 1.0))

        # Apply Gaussian noise to frequency and power
        frequency_mhz = round(self._gaussian_noise(freq_center, std=2.0), 3)
        power_dbm = round(self._gaussian_noise(power_center, std=2.0), 2)

        # Clamp duration to positive
        duration_ms = max(1, duration)

        return {
            # --- WebSocket schema fields ---
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "frequency_mhz": frequency_mhz,
            "power_dbm": power_dbm,
            "bandwidth_khz": round(float(bw), 2),
            "modulation": str(modulation),
            "duration_ms": duration_ms,
            "label": cls,
            "confidence": None,   # filled in by classifier
            "threat_score": None, # filled in by scorer
            # --- ML-only features (stripped before WebSocket send) ---
            "freq_hop_flag": freq_hop_flag,
            "burst_regularity": round(burst_regularity, 4),
        }
