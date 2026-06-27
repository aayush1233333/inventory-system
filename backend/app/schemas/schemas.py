from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.models import OrderStatus, UserRole


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    # Defaults to STAFF. In a real production system, only an existing admin
    # would be allowed to grant the ADMIN role (e.g. via a separate
    # admin-only endpoint) rather than exposing it on open self-registration.
    role: UserRole = UserRole.STAFF

    @field_validator("password")
    @classmethod
    def password_min_length(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    price: float
    stock_quantity: int = 0
    low_stock_threshold: int = 10
    category: Optional[str] = None

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Price must be positive")
        return value

    @field_validator("stock_quantity")
    @classmethod
    def stock_non_negative(cls, value: int) -> int:
        if value < 0:
            raise ValueError("Stock quantity cannot be negative")
        return value

    @field_validator("low_stock_threshold")
    @classmethod
    def threshold_non_negative(cls, value: int) -> int:
        if value < 0:
            raise ValueError("Low stock threshold cannot be negative")
        return value


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    category: Optional[str] = None

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, value: Optional[float]) -> Optional[float]:
        if value is not None and value <= 0:
            raise ValueError("Price must be positive")
        return value

    @field_validator("stock_quantity")
    @classmethod
    def stock_non_negative(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value < 0:
            raise ValueError("Stock quantity cannot be negative")
        return value

    @field_validator("low_stock_threshold")
    @classmethod
    def threshold_non_negative(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value < 0:
            raise ValueError("Low stock threshold cannot be negative")
        return value


class ProductOut(ProductBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerOut(CustomerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("Quantity must be at least 1")
        return value


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    product: Optional[ProductOut] = None

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]
    notes: Optional[str] = None

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, value: List[OrderItemCreate]) -> List[OrderItemCreate]:
        if not value:
            raise ValueError("Order must have at least one item")
        return value


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderOut(BaseModel):
    id: int
    customer_id: int
    status: OrderStatus
    total_amount: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    customer: Optional[CustomerOut] = None
    items: List[OrderItemOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class PaginatedResponse(BaseModel):
    items: list
    total: int
    skip: int
    limit: int


class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    pending_orders: int
    low_stock_products: int
    total_revenue: float
