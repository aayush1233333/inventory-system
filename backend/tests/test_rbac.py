from fastapi.testclient import TestClient

from tests.conftest import register_and_login


def _create_product(client: TestClient, sku: str = "RBAC-001") -> int:
    response = client.post(
        "/products",
        json={
            "name": "RBAC Test Product",
            "sku": sku,
            "description": "Used to test delete permissions",
            "price": 999.0,
            "stock_quantity": 5,
            "low_stock_threshold": 1,
            "category": "General",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_register_defaults_to_staff_role(client: TestClient) -> None:
    response = client.post(
        "/auth/register",
        json={"name": "New Hire", "email": "new-hire@example.com", "password": "testpass123"},
    )
    assert response.status_code == 201
    assert response.json()["role"] == "staff"


def test_me_endpoint_reports_role(client: TestClient) -> None:
    # `client` is authenticated as the default admin user (see conftest.py)
    response = client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["role"] == "admin"


def test_invalid_token_is_rejected(client: TestClient) -> None:
    response = client.get("/products", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401


def test_request_without_credentials_is_rejected(client: TestClient) -> None:
    response = client.get("/products", headers={"Authorization": ""})
    assert response.status_code in (401, 403)


def test_staff_can_create_and_read_but_not_delete_product(client: TestClient) -> None:
    product_id = _create_product(client, sku="RBAC-STAFF-001")

    staff_token = register_and_login(client, "staff-member@example.com", role="staff")
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    # Staff can do normal day-to-day operations.
    list_response = client.get("/products", headers=staff_headers)
    assert list_response.status_code == 200

    # But cannot delete — that's an admin-only, business-critical action.
    delete_response = client.delete(f"/products/{product_id}", headers=staff_headers)
    assert delete_response.status_code == 403

    # Confirm the product genuinely still exists.
    get_response = client.get(f"/products/{product_id}")  # default client = admin
    assert get_response.status_code == 200


def test_admin_can_delete_product(client: TestClient) -> None:
    product_id = _create_product(client, sku="RBAC-ADMIN-001")

    # The default `client` fixture is already authenticated as an admin.
    delete_response = client.delete(f"/products/{product_id}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/products/{product_id}")
    assert get_response.status_code == 404


def test_staff_cannot_delete_order(client: TestClient) -> None:
    customer_response = client.post(
        "/customers",
        json={
            "name": "RBAC Customer",
            "email": "rbac-customer@example.com",
            "phone": "+91 90000 11111",
            "address": "Test address",
        },
    )
    customer_id = customer_response.json()["id"]
    product_id = _create_product(client, sku="RBAC-ORDER-001")

    order_response = client.post(
        "/orders",
        json={"customer_id": customer_id, "items": [{"product_id": product_id, "quantity": 1}]},
    )
    order_id = order_response.json()["id"]

    staff_token = register_and_login(client, "staff-orders@example.com", role="staff")
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    delete_response = client.delete(f"/orders/{order_id}", headers=staff_headers)
    assert delete_response.status_code == 403

    get_response = client.get(f"/orders/{order_id}")
    assert get_response.status_code == 200
