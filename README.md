# RF Signal Analyzer

A fully self-contained RF signal intelligence dashboard built for the **CodeClash** hackathon. A Python backend generates synthetic radio-frequency signals, classifies them in real time with a scikit-learn Random Forest model, computes a threat score, and streams the results over WebSocket at ~2 Hz to a military-themed React dashboard. No real hardware, no SDR, no external data source required.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
  - [Docker (Recommended)](#docker-recommended)
  - [Local Development](#local-development)
  - [One-Command Launch (Linux)](#one-command-launch-linux)
- [Dashboard Overview](#dashboard-overview)
- [Signal Classification Pipeline](#signal-classification-pipeline)
  - [Signal Generation](#signal-generation)
  - [ML Classifier](#ml-classifier)
  - [Threat Scoring](#threat-scoring)
- [Scenarios](#scenarios)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Environment & Ports](#environment--ports)

---

## Features

- **Real-time signal streaming** — WebSocket pushes classified signals at 2 Hz with automatic reconnection
- **Machine learning classification** — 100-tree Random Forest classifies signals as friendly, unknown, or hostile with >99% accuracy
- **Live scenario switching** — Toggle between Peacekeeping, Border Patrol, and Active Conflict without restarting or reconnecting
- **Spectrum waterfall** — Full-width HTML5 Canvas spectrogram with Gaussian signal blobs and scrolling noise floor
- **Animated radar display** — SVG radar with rotating sweep arm, distance rings, and threat-coded signal dots with targeting reticles
- **Threat scoring & alerting** — Real-time threat score computation with glitch-text alert banner on threshold breach
- **Terminal log** — Typewriter-effect signal intercept log with per-character animation at 60fps
- **Glassmorphism UI** — Dark military-ops theme with neon glow effects, animated metrics, and class-coded color badges
- **Docker-ready** — Single `docker compose up` launches everything with pre-trained model baked into the image

---

## Tech Stack

| Layer | Technology |
|---|---|
| Signal Generator | Python, NumPy (Gaussian noise, per-scenario class ratios) |
| ML Classifier | scikit-learn `RandomForestClassifier` (100 trees, 10 features) |
| API / WebSocket | FastAPI, uvicorn, Pydantic v2 |
| Frontend | React 18, Vite 5, Tailwind CSS v3, Recharts |
| UI Primitives | Radix UI (Tooltip, ScrollArea, Progress, Separator) via shadcn/ui |
| Reverse Proxy | Nginx (production) / Vite dev proxy (development) |
| Containerization | Docker, Docker Compose |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER (React)                          │
│                                                                  │
│  ┌────────────┐ ┌──────────────┐ ┌───────────┐ ┌─────────────┐  │
│  │ FeedTable  │ │ ThreatChart  │ │  Radar    │ │ Spectrogram │  │
│  └────────────┘ └──────────────┘ └───────────┘ └─────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                      TerminalLog                            ││
│  └──────────────────────────────────────────────────────────────┘│
│           ▲         useSignalFeed (WebSocket hook)                │
└───────────┼──────────────────────────────────────────────────────┘
            │  ws://host/ws/signals (JSON events @ 500ms)
            │
┌───────────┼──────────────────────────────────────────────────────┐
│           ▼              BACKEND (FastAPI)                        │
│                                                                  │
│  signal_loop() ─── every 500ms ──────────────────────┐           │
│       │                                               │           │
│       ▼                                               ▼           │
│  ┌────────────┐    ┌──────────────┐    ┌──────────┐  broadcast() │
│  │ simulator  │───▶│  classifier  │───▶│  scorer  │──▶ WebSocket │
│  │ .generate()│    │  .classify() │    │ .compute │   to clients │
│  └────────────┘    └──────────────┘    └──────────┘              │
│                    (model.pkl via joblib)                         │
│                                                                  │
│  REST: GET/POST /scenario · GET /status                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Docker (Recommended)

```bash
cd rf-analyzer
docker compose up
```

Open **http://localhost** — the dashboard loads immediately and signals start flowing.

> The backend trains the ML model during the Docker build (`RUN python train.py`), so the first `docker compose up` may take a minute to pull images. Subsequent starts are instant.

### Local Development

You need **two terminals** — one for the backend, one for the frontend.

#### Terminal 1: Backend (FastAPI + ML)

```bash
cd rf-analyzer/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python train.py          # generates model.pkl (~6000 signals)
uvicorn main:app --reload --port 8000
```

#### Terminal 2: Frontend (React + Vite)

```bash
cd rf-analyzer/frontend
npm install
npm run dev
```

The frontend dev server is available at **http://localhost:5173**. The Vite proxy forwards `/api/*` and `/ws/*` to the backend on port 8000 automatically.

### One-Command Launch (Linux)

From the repository root:

```bash
./run.sh
```

This script automatically:
1. Creates a Python virtual environment (handling PEP 668 restrictions)
2. Installs backend dependencies and trains the model
3. Starts the uvicorn backend server
4. Installs frontend dependencies and starts the Vite dev server
5. Opens backend and frontend in separate terminal windows (gnome-terminal, x-terminal-emulator, or background processes as fallback)

---

## Dashboard Overview

The dashboard consists of five main visual sections arranged in a military-ops dark theme:

| Section | Component | Description |
|---|---|---|
| **Top Bar** | `App.jsx` + `ScenarioSwitcher` | Connection status indicator, signals/sec rate, live scenario toggle buttons |
| **Metric Cards** | `MetricCard` (inline) | Three animated cards — Total Signals, Current Threat Score (glows red when >70), Average Confidence |
| **Spectrum Waterfall** | `SpectrogramCanvas` | Full-width HTML5 Canvas with scrolling waterfall display. Signals appear as Gaussian blobs: cyan (friendly), amber (unknown), red (hostile) with white spikes for hostile |
| **Data Row** | `FeedTable` + `ThreatChart` + `RadarWidget` | Signal feed table with badge-coded classification, Recharts area chart of rolling threat scores, animated SVG radar with rotating sweep arm |
| **Terminal Log** | `TerminalLog` | Typewriter-effect log that "types out" each signal intercept at ~60fps with per-character animation and status bar tracking total intercepts |

### Alert System

When a signal's threat score exceeds **70**, the dashboard triggers a full-width sticky `AlertOverlay` banner with:
- Glitch-text effect ("!! THREAT DETECTED !!")
- Signal details (frequency, modulation, score, confidence)
- 6-second countdown auto-dismiss (click to dismiss early)
- Red gradient background spanning the full viewport width

---

## Signal Classification Pipeline

### Signal Generation

The `SignalGenerator` class in `simulator.py` produces synthetic RF signals with class-specific characteristics:

| Parameter | Friendly | Unknown | Hostile |
|---|---|---|---|
| **Frequency** | 136–174 MHz | 300–512 MHz | 2000–4000 MHz |
| **Power** | -80 to -60 dBm | -70 to -50 dBm | -55 to -30 dBm |
| **Bandwidth** | 10–30 kHz | 20–100 kHz | 100–500 kHz |
| **Duration** | ~500ms (σ=80) | ~200ms (σ=100) | ~50ms (σ=20) |
| **Modulation** | AM, FM | AM, FM, PSK, QAM | PSK, QAM |
| **Freq Hop Flag** | 0 | 0 | 1 |
| **Burst Regularity** | ~0.85 | ~0.50 | ~0.15 |

Gaussian noise (σ=2.0) is applied to frequency and power values for realistic variation.

### ML Classifier

The classifier uses a **Random Forest** with 100 decision trees, trained on 6,000 synthetic signals (2,000 per class). It achieves **perfect precision and recall** on the test set because the signal classes occupy non-overlapping frequency bands by design.

**10 input features:**
`frequency_mhz`, `power_dbm`, `bandwidth_khz`, `duration_ms`, `freq_hop_flag`, `burst_regularity`, `mod_AM`, `mod_FM`, `mod_PSK`, `mod_QAM` (one-hot encoded)

The model is serialized to `model.pkl` via joblib. If the file is missing at runtime, the classifier auto-trains by calling `train.main()`.

### Threat Scoring

```
power_weight = 1.0  if power_dbm > -50 dBm
             = 0.7  otherwise

threat_score = int(confidence × power_weight × 100)   # hostile signals
             = int(confidence × 20)                    # friendly / unknown
```

**Alert threshold: score > 70.** The dashboard fires the full-width banner and pulses the threat metric card red when crossed.

---

## Scenarios

Scenarios control the probability distribution of signal classes emitted by the generator. Switch between them live via the buttons in the top bar — the backend updates immediately, no restart needed.

| Scenario | Friendly | Unknown | Hostile |
|---|---|---|---|
| Peacekeeping | 90% | 8% | 2% |
| Border Patrol | 60% | 25% | 15% |
| Active Conflict | 45% | 30% | 25% |

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/scenario` | `GET` | Returns current scenario and list of available options: `{"scenario": "active_conflict", "options": [...]}` |
| `/scenario` | `POST` | Switch scenario. Body: `{"name": "peacekeeping"}`. Returns updated scenario. |
| `/status` | `GET` | Health check: `{"status": "ok", "scenario": "...", "clients_connected": N}` |
| `/ws/signals` | WebSocket | Streams JSON signal events at ~500ms intervals |

### WebSocket Signal Schema

```json
{
  "id": "sig_00042",
  "timestamp": "2026-04-12T10:30:00.000000+00:00",
  "frequency_mhz": 2541.032,
  "power_dbm": -42.15,
  "bandwidth_khz": 312.44,
  "modulation": "PSK",
  "duration_ms": 48,
  "label": "hostile",
  "confidence": 0.97,
  "threat_score": 97
}
```

> **Note:** Internal ML-only features (`freq_hop_flag`, `burst_regularity`) are used for classification but are **not** sent over the WebSocket.

---

## Project Structure

```
CODECLASH/
├── run.sh                          # One-command launcher (Linux)
├── README.md                       # This file
├── .gitignore
│
└── rf-analyzer/
    ├── docker-compose.yml          # Two-service compose (backend + frontend)
    ├── CLAUDE.md                   # Project specification / context doc
    ├── DEMO_SCRIPT.md              # 90-second demo walkthrough
    ├── README.md                   # Inner project readme
    │
    ├── backend/
    │   ├── Dockerfile              # Python 3.11-slim, pre-trains model
    │   ├── requirements.txt        # FastAPI, scikit-learn, NumPy, etc.
    │   ├── main.py                 # FastAPI app, WebSocket, signal loop
    │   ├── simulator.py            # SignalGenerator with scenario profiles
    │   ├── classifier.py           # RF classifier (loads model.pkl)
    │   ├── scorer.py               # Threat score computation
    │   ├── train.py                # Model training script (6000 samples)
    │   ├── model.pkl               # Serialized RandomForest model
    │   └── scenarios/              # Pre-generated scenario data (JSON)
    │       ├── active_conflict.json
    │       ├── border_patrol.json
    │       └── peacekeeping.json
    │
    └── frontend/
        ├── Dockerfile              # Multi-stage: Node build → Nginx serve
        ├── nginx.conf              # Reverse proxy for API + WebSocket
        ├── package.json            # React 18, Vite 5, Recharts, Radix UI
        ├── vite.config.js          # Dev proxy: /api → :8000, /ws → :8000
        ├── tailwind.config.js      # Custom theme with neon colors
        ├── index.html              # Entry HTML
        │
        └── src/
            ├── main.jsx            # React root with ThemeProvider
            ├── App.jsx             # Main layout + MetricCards
            ├── index.css           # Global styles, glow effects, animations
            │
            ├── hooks/
            │   ├── useSignalFeed.js    # WebSocket client + auto-reconnect
            │   └── useCountUp.js       # rAF easeOutQuart counter animation
            │
            ├── context/
            │   └── ThemeContext.jsx     # Threat alert state (trigger/clear)
            │
            ├── components/
            │   ├── AlertOverlay.jsx     # Sticky threat banner with glitch text
            │   ├── FeedTable.jsx        # Scrollable signal table with badges
            │   ├── ThreatChart.jsx      # Recharts live threat score area chart
            │   ├── RadarWidget.jsx      # SVG radar with sweep + signal dots
            │   ├── SpectrogramCanvas.jsx# Canvas waterfall spectrogram
            │   ├── ScenarioSwitcher.jsx # Scenario toggle buttons
            │   ├── TerminalLog.jsx      # Typewriter terminal log (60fps)
            │   └── ui/                  # shadcn/ui primitives
            │       ├── badge.jsx
            │       ├── button.jsx
            │       ├── card.jsx
            │       ├── progress.jsx
            │       ├── scroll-area.jsx
            │       ├── separator.jsx
            │       ├── table.jsx
            │       └── tooltip.jsx
            │
            └── lib/
                └── utils.js            # cn() utility (clsx + tailwind-merge)
```

---

## Environment & Ports

| Service | Port | Notes |
|---|---|---|
| Frontend (dev) | `5173` | Vite dev server with HMR |
| Backend | `8000` | FastAPI + uvicorn |
| Frontend (prod) | `80` | Nginx serving static build + reverse proxy |
| WebSocket (dev) | `5173` → proxy to `8000` | Via Vite config |
| WebSocket (prod) | `80` → proxy to `8000` | Via Nginx config |

### Requirements

- **Backend:** Python 3.11+, pip
- **Frontend:** Node.js 20+, npm
- **Docker (optional):** Docker Engine 24+, Docker Compose v2

---

<p align="center">
  Built for <strong>CodeClash</strong> · No real RF hardware required
</p>
