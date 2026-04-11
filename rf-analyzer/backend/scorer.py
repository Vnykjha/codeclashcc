"""Threat score formula from CLAUDE.md."""


def compute_threat_score(label: str, confidence: float, power_dbm: float) -> int:
    power_weight = 1.0 if power_dbm > -50 else 0.7
    if label == "hostile":
        return int(confidence * power_weight * 100)
    return int(confidence * 20)
