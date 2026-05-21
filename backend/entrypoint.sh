#!/bin/bash
set -e

# Ensure we're in the backend directory
cd "$(dirname "$0")"

# Log the startup
echo "Starting RQ Worker via Python launcher..."
echo "Python version: $(python --version)"
echo "REDIS_URL: ${REDIS_URL:-NOT SET}"

# Execute the Python worker launcher directly
exec python run_worker.py "$@"
