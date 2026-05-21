#!/bin/bash
set -e

# This script is a wrapper that ensures the Python worker launcher runs
# It handles the case where Railway or other orchestrators invoke this script

echo "Starting RQ Worker via Python launcher..."
exec python3 /app/run_worker.py
