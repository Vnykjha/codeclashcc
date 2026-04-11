# CODECLASH Workspace

Welcome to the CODECLASH workspace! This repository currently hosts the **RF Analyzer** project.

## Project: RF Analyzer

A fully self-contained RF signal intelligence dashboard. A Python backend generates synthetic radio-frequency signals, classifies them with a scikit-learn Random Forest, computes a threat score, and streams the results over WebSocket to a React dashboard. No real hardware or SDR required.

### Quick Start (Docker)

To quickly get the application up and running using Docker:

1. Navigate into the `rf-analyzer` directory:
   ```bash
   cd rf-analyzer
   ```
2. Start the services using Docker Compose:
   ```bash
   docker compose up
   ```
3. Open **http://localhost** in your browser. The dashboard will load and signals will start flowing immediately.

### Development Setup (Local)

If you'd like to run the project without Docker for development purposes, you will need two terminal windows:

#### 1. Backend (FastAPI + Machine Learning)
Open a terminal and run the following commands:
```bash
cd rf-analyzer/backend
pip install -r requirements.txt
python train.py
uvicorn main:app --reload --port 8000
```
*Note: Ensure you have a virtual environment set up if preferred.*

#### 2. Frontend (React + Vite)
Open a second terminal and run:
```bash
cd rf-analyzer/frontend
npm install
npm run dev
```

The frontend dev server will be available at **http://localhost:5173**.

---

### Tech Stack Details

- **Backend**: Python, FastAPI, WebSockets, scikit-learn (`RandomForestClassifier`)
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts
- **Deployment**: Docker, Docker Compose, Nginx
