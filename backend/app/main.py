from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import auth, customers, dashboard, orders, products

settings = get_settings()

app = FastAPI(
    title="StockFlow Inventory & Order Management API",
    description="Full-stack inventory and order management system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "StockFlow API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
