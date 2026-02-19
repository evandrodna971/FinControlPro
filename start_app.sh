#!/bin/bash

# FinControl Pro Startup Script for WSL
# This script starts both the backend and frontend servers in the background.

BASE_DIR="/mnt/c/Users/996266/Documents/AUTOMAÇÕES/AUTOMACAO CLAMED/FinControlPro"
BACKEND_LOG="$BASE_DIR/backend_wsl.log"
FRONTEND_LOG="$BASE_DIR/frontend_wsl.log"

echo "Starting FinControl Pro Servers in WSL..."

# 1. Kill any existing processes
pkill -f "uvicorn backend.main:app"
pkill -f "vite"

# 2. Start Backend
echo "Starting Backend on port 8000..."
cd "$BASE_DIR"

# Determine Python command
PYTHON_CMD="python3"
if [ -d "backend/venv_wsl" ]; then
    PYTHON_CMD="$BASE_DIR/backend/venv_wsl/bin/python3"
elif [ -d "backend/venv" ]; then
    source backend/venv/bin/activate
fi

# IMPORTANT: Run from project root to avoid import errors
# Use backend.main:app instead of main:app
export PYTHONPATH="$BASE_DIR:$PYTHONPATH"
nohup "$PYTHON_CMD" -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "Backend started in background (PID: $BACKEND_PID). Logs: $BACKEND_LOG"

# 3. Start Frontend
echo "Starting Frontend on port 5173..."
cd "$BASE_DIR/frontend"
nohup npm run dev -- --host > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "Frontend started in background (PID: $FRONTEND_PID). Logs: $FRONTEND_LOG"

# Wait a moment for servers to start
sleep 2


echo "================================================"
echo "✅ FinControl Pro Startup Complete!"
echo "================================================"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "URLs:"
echo "  Backend API:  http://localhost:8000"
echo "  Frontend App: http://localhost:5173"
echo "  API Docs:     http://localhost:8000/docs"
echo ""
echo "Logs:"
echo "  Backend:  $BACKEND_LOG"
echo "  Frontend: $FRONTEND_LOG"
echo ""
echo "Commands:"
echo "  Check status:  ps auxw | grep -E 'python3|vite'"
echo "  View backend:  tail -f $BACKEND_LOG"
echo "  View frontend: tail -f $FRONTEND_LOG"
echo "  Stop servers:  pkill -f 'uvicorn backend.main:app' && pkill -f 'vite'"
echo "================================================"
