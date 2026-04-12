# RF Signal Analyzer — Requirements & Setup Guide

Everything you need to get this project running locally from a fresh clone.

---

## Prerequisites

### 1. Python 3.11+
The backend requires **Python 3.11 or higher** (uses the `X | Y` union type hint syntax).

- Download: https://www.python.org/downloads/
- Verify: `python --version`

### 2. Node.js 18+ and npm
The frontend requires **Node.js 18 or higher**.

- Download: https://nodejs.org/
- Verify: `node --version` and `npm --version`

### 3. Git *(already done if you cloned this)*
- Download: https://git-scm.com/

---

## Project Structure

```
rf-analyzer/
├── backend/      ← Python FastAPI server + ML classifier
└── frontend/     ← React + Vite + TailwindCSS dashboard
```

---

## Backend Setup

Navigate into the backend directory:

```bash
cd rf-analyzer/backend
```

### (Recommended) Create a virtual environment

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux:**
```bash
python -m venv venv
source venv/bin/activate
```

### Install Python dependencies

```bash
pip install -r requirements.txt
```

#### What gets installed

| Package | Version | Purpose |
|---|---|---|
| `fastapi` | ≥ 0.111.0 | Web framework & REST API |
| `uvicorn[standard]` | ≥ 0.29.0 | ASGI server to run FastAPI |
| `scikit-learn` | ≥ 1.4.0 | ML classifier (Random Forest) |
| `numpy` | ≥ 1.26.0 | Numerical signal processing |
| `pydantic` | ≥ 2.0.0 | Data validation for API models |
| `websockets` | ≥ 12.0 | WebSocket support |
| `joblib` | ≥ 1.4.0 | Loading/saving the trained model |

> **Note:** A pre-trained `model.pkl` is included in the repo. If it's missing or you want to retrain from scratch, the server will auto-train it on first startup using `train.py`.

### Run the backend

```bash
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.  
WebSocket endpoint: `ws://localhost:8000/ws/signals`

---

## Frontend Setup

Open a **new terminal** (keep the backend running) and navigate to the frontend:

```bash
cd rf-analyzer/frontend
```

### Install Node.js dependencies

```bash
npm install
```

#### What gets installed

| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.2.0 | UI framework |
| `react-dom` | ^18.2.0 | React DOM renderer |
| `recharts` | ^2.12.0 | Threat score area chart |
| `vite` | ^5.2.0 | Dev server & build tool |
| `@vitejs/plugin-react` | ^4.2.0 | JSX fast-refresh support |
| `tailwindcss` | ^3.4.3 | Utility-first CSS |
| `autoprefixer` | ^10.4.19 | CSS vendor prefix handling |
| `postcss` | ^8.4.38 | CSS transformation pipeline |

### Run the frontend dev server

```bash
npm run dev
```

The dashboard will open at `http://localhost:5173`.

> The Vite dev server is pre-configured (in `vite.config.js`) to proxy `/api` and `/ws` requests to the backend at port 8000 — so both servers need to be running at the same time.

---

## Running Both Together (Quick Start)

```bash
# Terminal 1 — Backend
cd rf-analyzer/backend
python -m venv venv && venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd rf-analyzer/frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Scenario Modes

Use the scenario switcher in the top-right of the dashboard to change signal behaviour:

| Scenario | Hostile % | Description |
|---|---|---|
| Peacekeeping | 2% | Mostly friendly signals |
| Border Patrol | 15% | Mixed environment |
| Active Conflict | 50% | High threat density |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `python` not found on Windows | Use `py` instead of `python`, or add Python to PATH |
| `pip install` fails on `scikit-learn` | Make sure you're inside the virtual environment first |
| Frontend shows "No connection" | Ensure the backend is running on port 8000 |
| `model.pkl` missing | Run `python train.py` inside `backend/` to generate it |
| Port 8000 already in use | Change to `--port 8001` and update `vite.config.js` proxy accordingly |
