import os
import tempfile
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

DEFAULT_PASSWORD = "testpass123"


def register_and_login(test_client: TestClient, email: str, role: str = "staff", password: str = DEFAULT_PASSWORD) -> str:
    """Register a user with the given role and return a bearer token for them."""
    test_client.post(
        "/auth/register",
        json={"name": email.split("@")[0], "email": email, "password": password, "role": role},
    )
    login_response = test_client.post("/auth/login", json={"email": email, "password": password})
    return login_response.json()["access_token"]


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)

    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):  # pragma: no cover
        del connection_record
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as test_client:
            # Most existing tests in this suite predate auth being enforced
            # on the business routes. Rather than rewriting every call site,
            # this fixture provisions a default admin user and attaches the
            # token as a default header, so `client` behaves like a fully
            # privileged user unless a test explicitly overrides the
            # Authorization header (see test_rbac.py for staff-restricted
            # scenarios).
            admin_token = register_and_login(test_client, "default-admin@example.com", role="admin")
            test_client.headers.update({"Authorization": f"Bearer {admin_token}"})
            yield test_client
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        os.remove(db_path)
