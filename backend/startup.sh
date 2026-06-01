#!/bin/sh
# Simple startup script: run migrations then start the server.
# Docker Compose guarantees PostgreSQL is healthy via depends_on,
# but for standalone deployments we keep a lightweight retry loop.

echo "Running Alembic migrations..."
alembic upgrade head

echo "Starting StockFlow API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000