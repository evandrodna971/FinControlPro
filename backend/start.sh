#!/bin/bash
# Script para iniciar o backend corretamente

cd "$(dirname "$0")"
export PYTHONPATH="${PYTHONPATH}:$(pwd)/.."
python3 -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
