# StockFlow Inventory and Order Management System

Production-ready inventory and order management system built to match the technical assessment stack:

- React (JavaScript)
- Python FastAPI backend
- PostgreSQL
- Docker
- Docker Compose
- Git

## Features

- Product management: create, list, update, delete
- Customer management: create, list, view, delete
- Order management: create, list, view details, cancel/delete
- Inventory tracking with low-stock and out-of-stock views
- Dashboard with product, customer, order, and low-stock totals

## Business Rules

- Product SKU must be unique
- Customer email must be unique
- Product quantity cannot be negative
- Orders are rejected when stock is insufficient
- Creating an order automatically reduces inventory
- Deleting or cancelling an order restores inventory
- Total order amount is calculated by the backend

## Project Structure

```text
inventory-system-complete/
|-- docker-compose.yml
|-- .env.example
|-- backend/
|   |-- Dockerfile
|   |-- .dockerignore
|   |-- requirements.txt
|   |-- alembic/
|   |-- app/
|   |   |-- main.py
|   |   |-- core/
|   |   |-- crud/
|   |   |-- models/
|   |   |-- routers/
|   |   `-- schemas/
|   `-- tests/
`-- frontend/
    |-- Dockerfile
    |-- .dockerignore
    |-- nginx.conf
    |-- package.json
    `-- src/
```

## API Endpoints

### Products

- `POST /products`
- `GET /products`
- `GET /products/{id}`
- `PUT /products/{id}`
- `DELETE /products/{id}`

### Customers

- `POST /customers`
- `GET /customers`
- `GET /customers/{id}`
- `DELETE /customers/{id}`

### Orders

- `POST /orders`
- `GET /orders`
- `GET /orders/{id}`
- `DELETE /orders/{id}`

Additional endpoint used by the UI:

- `PATCH /orders/{id}/status`

### Dashboard

- `GET /dashboard/stats`

## Local Development with Docker

### 1. Configure environment variables

Copy the example file and adjust values as needed:

```bash
cp .env.example .env
```

### 2. Start the full stack

```bash
docker compose up --build
```

### 3. Open the application

- Frontend: `http://localhost:80`
- Backend API: `http://localhost:8000`
- FastAPI docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Local Development without Docker

### Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
set REACT_APP_API_URL=http://localhost:8000
npm start
```

## Docker Notes

- Backend uses `python:3.11-slim`
- Frontend build uses `node:18-alpine`
- Runtime frontend uses `nginx:alpine`
- PostgreSQL data is stored in the named volume `postgres_data`
- API calls from the browser go through `/api` locally and are rewritten to the backend routes by Nginx

## Deployment Targets

The assessment asks for free hosting options. This project is prepared for:

- Backend: Render, Railway, or Fly.io
- Frontend: Vercel or Netlify

When deploying the frontend separately, set:

```text
REACT_APP_API_URL=https://your-backend-url
```

## Verification

Backend tests:

```bash
cd backend
.\.venv\Scripts\python.exe -m pytest
```

Frontend production build:

```bash
cd frontend
npm run build
```
