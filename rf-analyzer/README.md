# RF Signal Analyzer

A fully self-contained RF signal intelligence dashboard. A Python backend generates synthetic radio-frequency signals, classifies them with a scikit-learn Random Forest, computes a threat score, and streams the results over WebSocket at 2 Hz to a React dashboard. No real hardware, no SDR, no external data source required.

---

## Quick start

```bash
docker compose up
```

Open **http://localhost** — the dashboard loads immediately and signals start flowing.

The backend trains the ML model during the Docker build (`RUN python train.py`), so the first `docker compose up` may take a minute to pull images. Subsequent starts are instant.

---

## Screenshot

> _[screenshot placeholder]_

---

## Tech stack

| Layer | Technology |
|---|---|
| Signal generator | Python, NumPy (Gaussian noise, per-scenario class ratios) |
| ML classifier | scikit-learn `RandomForestClassifier` (100 trees, 10 features) |
| API / WebSocket | FastAPI + uvicorn, Pydantic v2 |
| Frontend | React 18, Vite, Tailwind CSS v3, Recharts |
| Reverse proxy | nginx (prod) / Vite dev proxy (dev) |
| Containerisation | Docker, Docker Compose |

---

## Threat score formula

```
power_weight = 1.0  if power_dbm > -50 dBm
             = 0.7  otherwise

threat_score = int(confidence × power_weight × 100)   # hostile signals
             = int(confidence × 20)                    # friendly / unknown
```

Alert threshold: **score > 70**. The dashboard fires a full-width banner and pulses the metric card when this threshold is crossed.

---

## Scenarios

| Scenario | Friendly | Unknown | Hostile |
|---|---|---|---|
| Peacekeeping | 90% | 8% | 2% |
| Border Patrol | 60% | 25% | 15% |
| Active Conflict | 30% | 20% | 50% |

Switch scenarios live via the buttons in the top bar — the backend updates the signal generator immediately, no restart needed.

---

## Development (without Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt
python train.py
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Frontend dev server: **http://localhost:5173**
