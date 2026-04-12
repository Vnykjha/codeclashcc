import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from websockets.exceptions import ConnectionClosedError, ConnectionClosedOK

from classifier import classify
from scorer import compute_threat_score
from simulator import SignalGenerator

logger = logging.getLogger(__name__)

ALLOWED_SCENARIOS = ["peacekeeping", "border_patrol", "active_conflict"]
SCHEMA_FIELDS = {
    "id", "timestamp", "frequency_mhz", "power_dbm", "bandwidth_khz",
    "modulation", "duration_ms", "label", "confidence", "threat_score",
}

# Module-level state
current_scenario: str = "active_conflict"
clients: set[WebSocket] = set()
clients_lock: asyncio.Lock | None = None  # created inside event loop
counter: int = 0


async def _get_lock() -> asyncio.Lock:
    global clients_lock
    if clients_lock is None:
        clients_lock = asyncio.Lock()
    return clients_lock


async def broadcast(message: str) -> None:
    lock = await _get_lock()
    async with lock:
        dead: set[WebSocket] = set()
        for ws in clients:
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        clients.difference_update(dead)


async def signal_loop() -> None:
    global counter
    gen = SignalGenerator()
    while True:
        try:
            raw = gen.generate(current_scenario)
            result = classify(raw)
            threat_score = compute_threat_score(
                result["label"], result["confidence"], raw["power_dbm"]
            )
            counter += 1
            event = {
                "id": f"sig_{counter:05d}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "frequency_mhz": raw["frequency_mhz"],
                "power_dbm": raw["power_dbm"],
                "bandwidth_khz": raw["bandwidth_khz"],
                "modulation": raw["modulation"],
                "duration_ms": raw["duration_ms"],
                "label": result["label"],
                "confidence": result["confidence"],
                "threat_score": threat_score,
            }
            await broadcast(json.dumps(event))
        except Exception as exc:
            logger.exception("signal_loop error: %s", exc)
        await asyncio.sleep(0.5)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure lock is created in the running event loop
    global clients_lock
    clients_lock = asyncio.Lock()
    task = asyncio.create_task(signal_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:80",
        "http://localhost",
        "*",   # permissive for hackathon — tighten for production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── WebSocket ──────────────────────────────────────────────────────────────────

@app.websocket("/ws/signals")
async def ws_signals(websocket: WebSocket):
    await websocket.accept()
    lock = await _get_lock()
    async with lock:
        clients.add(websocket)
    try:
        # recv loop keeps the connection alive and detects client-side closes
        while True:
            await websocket.receive_text()
    except (WebSocketDisconnect, ConnectionClosedOK, ConnectionClosedError):
        pass
    finally:
        async with lock:
            clients.discard(websocket)


# ── REST ───────────────────────────────────────────────────────────────────────

@app.get("/scenario")
def get_scenario():
    return {"scenario": current_scenario, "options": ALLOWED_SCENARIOS}


class ScenarioRequest(BaseModel):
    name: str


@app.post("/scenario")
def set_scenario(body: ScenarioRequest):
    global current_scenario
    if body.name not in ALLOWED_SCENARIOS:
        raise HTTPException(status_code=400, detail=f"Unknown scenario '{body.name}'. "
                            f"Allowed: {ALLOWED_SCENARIOS}")
    current_scenario = body.name
    return {"scenario": current_scenario}


@app.get("/status")
async def status():
    lock = await _get_lock()
    async with lock:
        n = len(clients)
    return {"status": "ok", "scenario": current_scenario, "clients_connected": n}
