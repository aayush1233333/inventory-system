from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.crud import products as crud
from app.models.models import UserRole
from app.schemas.schemas import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["Products"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[ProductOut])
def list_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    low_stock: bool = False,
    db: Session = Depends(get_db),
):
    items, _ = crud.list_all(db, skip=skip, limit=limit, search=search, low_stock=low_stock)
    return items


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
):
    if crud.get_by_sku(db, product.sku):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{product.sku}' already exists",
        )

    try:
        return crud.create(db, product)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product with this SKU already exists",
        ) from exc


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = crud.get(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def _save_product_update(
    product_id: int,
    updates: ProductUpdate,
    db: Session,
):
    product = crud.get(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if updates.sku:
        duplicate = crud.get_by_sku(db, updates.sku)
        if duplicate and duplicate.id != product_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{updates.sku}' already exists",
            )

    try:
        return crud.update(db, product, updates)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to update product because the SKU is already in use",
        ) from exc


@router.put("/{product_id}", response_model=ProductOut)
def replace_product(
    product_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db),
):
    return _save_product_update(product_id, ProductUpdate(**product.model_dump()), db)


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    updates: ProductUpdate,
    db: Session = Depends(get_db),
):
    return _save_product_update(product_id, updates, db)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = crud.get(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        crud.delete(db, product)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a product that is referenced by existing orders",
        ) from exc
