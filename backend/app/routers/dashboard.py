from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Customer, Order, OrderStatus, Product
from app.schemas.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
):
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    pending_orders = (
        db.query(func.count(Order.id))
        .filter(Order.status == OrderStatus.PENDING)
        .scalar()
        or 0
    )
    low_stock = (
        db.query(func.count(Product.id))
        .filter(Product.stock_quantity <= Product.low_stock_threshold)
        .scalar()
        or 0
    )
    total_revenue = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.status != OrderStatus.CANCELLED)
        .scalar()
        or 0.0
    )

    return DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        pending_orders=pending_orders,
        low_stock_products=low_stock,
        total_revenue=round(float(total_revenue), 2),
    )
