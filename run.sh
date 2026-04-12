#!/bin/bash

# Navigate to the workspace directory
cd "$(dirname "$0")/rf-analyzer"

echo "Starting RF Analyzer Project..."

# Automatically handle Python Virtual Environment to avoid PEP 668 ("externally-managed-environment") errors
BACKEND_CMD="cd backend || exit; echo 'Setting up backend...'; python3 -m venv venv; source venv/bin/activate; pip install -r requirements.txt; echo 'Starting backend...'; python train.py; uvicorn main:app --reload --port 8000; exec bash"

FRONTEND_CMD="cd frontend || exit; echo 'Setting up frontend...'; npm install; echo 'Starting frontend...'; npm run dev; exec bash"

# Try using gnome-terminal (default on Ubuntu)
if command -v gnome-terminal &> /dev/null; then
    echo "Opening backend and frontend in separate gnome-terminal windows..."
    gnome-terminal --title="RF-Analyzer: Backend" -- bash -c "$BACKEND_CMD"
    gnome-terminal --title="RF-Analyzer: Frontend" -- bash -c "$FRONTEND_CMD"
# Fallback to x-terminal-emulator
elif command -v x-terminal-emulator &> /dev/null; then
    echo "Opening backend and frontend in separate terminal windows..."
    x-terminal-emulator -T "RF-Analyzer: Backend" -e bash -c "$BACKEND_CMD" &
    x-terminal-emulator -T "RF-Analyzer: Frontend" -e bash -c "$FRONTEND_CMD" &
else
    # Fallback if no specific terminal emulator is detected
    echo "No terminal emulator detected. Running concurrently in the background..."
    
    bash -c "$BACKEND_CMD" &
    BACKEND_PID=$!
    
    bash -c "$FRONTEND_CMD" &
    FRONTEND_PID=$!
    
    echo "Press Ctrl+C to stop both servers."
    trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
    wait
fi
