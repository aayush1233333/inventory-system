from sqlalchemy.orm import Session
from app.models.models import User, UserRole
from app.core.security import hash_password


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create(db: Session, name: str, email: str, password: str, role: UserRole = UserRole.STAFF) -> User:
    user = User(name=name, email=email, hashed_password=hash_password(password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def count(db: Session) -> int:
    return db.query(User).count()
