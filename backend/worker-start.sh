#!/bin/bash
# Worker startup wrapper to prevent RQ CLI auto-detection
# This script explicitly runs the Python worker launcher, nothing else

set -e  # Exit on any error

echo "================================================================================"
echo "WORKER STARTUP WRAPPER: Starting Python worker launcher"
echo "================================================================================"
echo ""
echo "Working directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Script path: $(cd "$(dirname "$0")" && pwd)/run_worker.py"
echo "REDIS_URL environment: ${REDIS_URL:-NOT SET}"
echo ""

# Absolutely explicit: Run Python with run_worker.py
# Use full path to avoid any search path issues
exec python -u "$(cd "$(dirname "$0")" && pwd)/run_worker.py"
