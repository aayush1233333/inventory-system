from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.crud import orders as crud
from app.models.models import Customer, OrderStatus, UserRole
from app.schemas.schemas import OrderCreate, OrderOut, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["Orders"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[OrderOut])
def list_orders(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[OrderStatus] = Query(None, alias="status"),
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    items, _ = crud.list_all(
        db,
        skip=skip,
        limit=limit,
        status_filter=status_filter,
        customer_id=customer_id,
    )
    return items


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    try:
        return crud.create(db, order_data.customer_id, order_data.items, order_data.notes)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
):
    order = crud.get(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    db: Session = Depends(get_db),
):
    order = crud.get(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return crud.update_status(db, order, body.status)


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
):
    order = crud.get(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    crud.delete(db, order)
