from fastapi import APIRouter, Depends
from sqlalchemy import func, select, true
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Customer, Order, OrderStatus, Product
from app.schemas.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"], dependencies=[Depends(get_current_user)])


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
):
    product_stats = select(
        func.count(Product.id).label("total_products"),
        func.count(Product.id)
        .filter(Product.stock_quantity <= Product.low_stock_threshold)
        .label("low_stock_products"),
    ).subquery()
    customer_stats = select(
        func.count(Customer.id).label("total_customers")
    ).subquery()
    order_stats = select(
        func.count(Order.id).label("total_orders"),
        func.count(Order.id)
        .filter(Order.status == OrderStatus.PENDING)
        .label("pending_orders"),
        func.coalesce(
            func.sum(Order.total_amount).filter(
                Order.status != OrderStatus.CANCELLED
            ),
            0.0,
        ).label("total_revenue"),
    ).subquery()

    stats = db.execute(
        select(
            product_stats.c.total_products,
            customer_stats.c.total_customers,
            order_stats.c.total_orders,
            order_stats.c.pending_orders,
            product_stats.c.low_stock_products,
            order_stats.c.total_revenue,
        )
        .select_from(product_stats)
        .join(customer_stats, true())
        .join(order_stats, true())
    ).one()

    return DashboardStats(
        total_products=stats.total_products,
        total_customers=stats.total_customers,
        total_orders=stats.total_orders,
        pending_orders=stats.pending_orders,
        low_stock_products=stats.low_stock_products,
        total_revenue=round(float(stats.total_revenue), 2),
    )
