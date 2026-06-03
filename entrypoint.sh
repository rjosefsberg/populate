#!/bin/sh
set -e

echo "Running database migrations..."
flask db upgrade

echo "Starting server..."
exec gunicorn -w 2 -b 0.0.0.0:5000 run:app
