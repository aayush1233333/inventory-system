from fastapi.testclient import TestClient


def test_duplicate_product_sku_is_rejected(client: TestClient) -> None:
    payload = {
        "name": "Laptop",
        "sku": "LAP-001",
        "description": "15-inch business laptop",
        "price": 49999.0,
        "stock_quantity": 12,
        "low_stock_threshold": 3,
        "category": "Electronics",
    }

    first_response = client.post("/products", json=payload)
    assert first_response.status_code == 201

    duplicate_response = client.post("/products", json={**payload, "name": "Backup Laptop"})
    assert duplicate_response.status_code == 409
    assert "SKU" in duplicate_response.json()["detail"]


def test_duplicate_customer_email_is_rejected(client: TestClient) -> None:
    payload = {
        "name": "Priya Sharma",
        "email": "priya@example.com",
        "phone": "+91 98765 43210",
        "address": "MG Road, Bengaluru",
    }

    first_response = client.post("/customers", json=payload)
    assert first_response.status_code == 201

    duplicate_response = client.post("/customers", json={**payload, "name": "Priya S."})
    assert duplicate_response.status_code == 409
    assert "email" in duplicate_response.json()["detail"].lower()


def test_product_update_rejects_negative_stock(client: TestClient) -> None:
    create_response = client.post(
        "/products",
        json={
            "name": "Warehouse Monitor",
            "sku": "MON-009",
            "description": "27-inch display",
            "price": 12999.0,
            "stock_quantity": 5,
            "low_stock_threshold": 2,
            "category": "Displays",
        },
    )
    assert create_response.status_code == 201

    update_response = client.patch(
        f"/products/{create_response.json()['id']}",
        json={"stock_quantity": -1},
    )

    assert update_response.status_code == 422
