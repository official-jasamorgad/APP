"""Comprehensive backend tests for Multi Services Marketplace.
Covers: health, catalog, auth, cart/checkout, orders, bookings, reviews,
wishlist, role protection, store owner flow, admin flow.
"""
import os
import uuid
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://marketplace-hub-1550.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"

ADMIN = {"email": "admin@marketplace.id", "password": "Admin@12345"}
OWNER = {"email": "owner@marketplace.id", "password": "Owner@12345"}
CUSTOMER = {"email": "customer@marketplace.id", "password": "Customer@12345"}


# ----- session factory -----
def make_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def login(session, creds):
    r = session.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()


# ================== Health ==================
def test_health():
    r = requests.get(f"{API}/health", timeout=30)
    assert r.status_code == 200
    body = r.json()
    assert body.get("ok") is True


# ================== Catalog ==================
class TestCatalog:
    def test_categories(self):
        r = requests.get(f"{API}/categories", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) > 0

    def test_categories_product(self):
        r = requests.get(f"{API}/categories?type=product", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert all(c["type"] == "product" for c in data)

    def test_categories_service(self):
        r = requests.get(f"{API}/categories?type=service", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert all(c["type"] == "service" for c in data)

    def test_products(self):
        r = requests.get(f"{API}/products", timeout=30)
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_products_featured(self):
        r = requests.get(f"{API}/products/featured", timeout=30)
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_services(self):
        r = requests.get(f"{API}/services", timeout=30)
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_services_featured(self):
        r = requests.get(f"{API}/services/featured", timeout=30)
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_stores(self):
        r = requests.get(f"{API}/stores", timeout=30)
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_banners(self):
        r = requests.get(f"{API}/banners", timeout=30)
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_product_detail(self):
        prods = requests.get(f"{API}/products", timeout=30).json()
        pid = prods[0]["id"]
        r = requests.get(f"{API}/products/{pid}", timeout=30)
        assert r.status_code == 200
        assert r.json()["id"] == pid

    def test_service_detail(self):
        svcs = requests.get(f"{API}/services", timeout=30).json()
        sid = svcs[0]["id"]
        r = requests.get(f"{API}/services/{sid}", timeout=30)
        assert r.status_code == 200
        assert r.json()["id"] == sid

    def test_store_detail(self):
        stores = requests.get(f"{API}/stores", timeout=30).json()
        stid = stores[0]["id"]
        r = requests.get(f"{API}/stores/{stid}", timeout=30)
        assert r.status_code == 200
        assert r.json()["id"] == stid

    def test_search(self):
        r = requests.get(f"{API}/search?q=ikan", timeout=30)
        assert r.status_code == 200
        j = r.json()
        assert "products" in j and "services" in j and "stores" in j


# ================== Auth ==================
class TestAuth:
    def test_register_me_logout(self):
        s = make_session()
        rand = uuid.uuid4().hex[:8]
        payload = {
            "email": f"TEST_user_{rand}@example.com",
            "password": "Password@123",
            "name": "Test User",
            "role": "customer",
        }
        r = s.post(f"{API}/auth/register", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        user = r.json()
        assert user["email"] == payload["email"].lower()
        assert user["role"] == "customer"

        # /me returns user
        r = s.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 200
        assert r.json()["email"] == payload["email"].lower()

        # logout clears cookies
        r = s.post(f"{API}/auth/logout", timeout=30)
        assert r.status_code == 200

        # /me should return 401 now
        s2 = requests.Session()
        r = s2.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401

    def test_login_admin(self):
        s = make_session()
        user = login(s, ADMIN)
        assert user["role"] == "admin"

    def test_login_owner(self):
        s = make_session()
        user = login(s, OWNER)
        assert user["role"] == "store_owner"

    def test_login_customer(self):
        s = make_session()
        user = login(s, CUSTOMER)
        assert user["role"] == "customer"

    def test_login_invalid(self):
        s = make_session()
        r = s.post(f"{API}/auth/login", json={"email": "nobody@example.com", "password": "wrong123"}, timeout=30)
        assert r.status_code == 401


# ================== Cart / Checkout ==================
class TestCheckout:
    def test_coupon_validate(self):
        r = requests.post(f"{API}/coupons/validate", json={"code": "HEMAT30", "subtotal": 200000}, timeout=30)
        assert r.status_code == 200
        j = r.json()
        assert j["discount"] == 60000

    def test_shipping_quote(self):
        r = requests.post(f"{API}/shipping/quote", json={"destination_city": "Jakarta"}, timeout=30)
        assert r.status_code == 200
        opts = r.json()["options"]
        assert isinstance(opts, list) and len(opts) > 0

    def test_order_creation_full_flow(self):
        s = make_session()
        login(s, CUSTOMER)

        products = requests.get(f"{API}/products?limit=5", timeout=30).json()
        assert len(products) >= 2
        p1, p2 = products[0], products[1]

        # shipping quote
        quote = s.post(f"{API}/shipping/quote", json={"destination_city": "Jakarta"}, timeout=30).json()
        jne_opt = next((o for o in quote["options"] if o["courier_code"] == "jne" and o["service"] == "REG"), None)
        assert jne_opt

        order_payload = {
            "items": [
                {"product_id": p1["id"], "qty": 2},
                {"product_id": p2["id"], "qty": 1},
            ],
            "address": {
                "label": "Home",
                "recipient": "Test Customer",
                "phone": "081234567890",
                "line1": "Jl. Sudirman 1",
                "city": "Jakarta",
                "province": "DKI Jakarta",
                "postal_code": "12190",
            },
            "payment_method": "cod",
            "courier_code": "jne",
            "courier_service": "REG",
            "shipping_cost": jne_opt["cost"],
            "coupon_code": "HEMAT30",
        }
        r = s.post(f"{API}/orders", json=order_payload, timeout=30)
        assert r.status_code == 200, r.text
        order = r.json()

        # verify totals
        assert order["subtotal"] > 0
        expected_total = order["subtotal"] + order["shipping_cost"] - order["discount"]
        assert order["total"] == expected_total
        assert order["tracking_number"].startswith("AWB")
        assert order["status"] == "pending"

        # order shows in list
        r = s.get(f"{API}/orders", timeout=30)
        assert r.status_code == 200
        oids = [o["id"] for o in r.json()]
        assert order["id"] in oids

        # order detail
        r = s.get(f"{API}/orders/{order['id']}", timeout=30)
        assert r.status_code == 200
        assert r.json()["id"] == order["id"]


# ================== Bookings ==================
class TestBookings:
    def test_booking_flow(self):
        s = make_session()
        login(s, CUSTOMER)
        svcs = requests.get(f"{API}/services", timeout=30).json()
        assert len(svcs) > 0
        sid = svcs[0]["id"]
        payload = {
            "service_id": sid,
            "date": "2026-02-15",
            "time": "10:00",
            "notes": "test booking",
        }
        r = s.post(f"{API}/bookings", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        booking = r.json()
        assert booking["status"] == "pending"
        assert booking["service_id"] == sid

        r = s.get(f"{API}/bookings", timeout=30)
        assert r.status_code == 200
        assert any(b["id"] == booking["id"] for b in r.json())


# ================== Reviews ==================
class TestReviews:
    def test_review_flow(self):
        s = make_session()
        login(s, CUSTOMER)
        products = requests.get(f"{API}/products", timeout=30).json()
        pid = products[0]["id"]
        rand = uuid.uuid4().hex[:6]
        r = s.post(f"{API}/reviews", json={
            "target_type": "product",
            "target_id": pid,
            "rating": 5,
            "comment": f"TEST_review_{rand}",
        }, timeout=30)
        assert r.status_code == 200, r.text

        r = requests.get(f"{API}/reviews?target_type=product&target_id={pid}", timeout=30)
        assert r.status_code == 200
        reviews = r.json()
        assert any(rv["comment"] == f"TEST_review_{rand}" for rv in reviews)

        r = requests.get(f"{API}/products/{pid}", timeout=30)
        assert r.status_code == 200
        assert r.json()["review_count"] >= 1


# ================== Wishlist ==================
class TestWishlist:
    def test_wishlist_flow(self):
        s = make_session()
        login(s, CUSTOMER)
        products = requests.get(f"{API}/products", timeout=30).json()
        pid = products[0]["id"]

        r = s.post(f"{API}/wishlist/{pid}", timeout=30)
        assert r.status_code == 200

        r = s.get(f"{API}/wishlist", timeout=30)
        assert r.status_code == 200
        assert any(p["id"] == pid for p in r.json())

        r = s.delete(f"{API}/wishlist/{pid}", timeout=30)
        assert r.status_code == 200

        r = s.get(f"{API}/wishlist", timeout=30)
        assert not any(p["id"] == pid for p in r.json())


# ================== Role protection ==================
class TestRoleProtection:
    def test_unauth_customer_dashboard(self):
        r = requests.get(f"{API}/dashboard/customer", timeout=30)
        assert r.status_code == 401

    def test_customer_cannot_access_store_dash(self):
        s = make_session()
        login(s, CUSTOMER)
        r = s.get(f"{API}/dashboard/store", timeout=30)
        assert r.status_code == 403

    def test_admin_dashboard(self):
        s = make_session()
        login(s, ADMIN)
        r = s.get(f"{API}/dashboard/admin", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "monthly_revenue" in data
        assert "orders_by_status" in data
        assert "users" in data


# ================== Store owner flow ==================
class TestStoreOwner:
    def test_owner_endpoints(self):
        s = make_session()
        login(s, OWNER)

        r = s.get(f"{API}/store/my", timeout=30)
        assert r.status_code == 200
        my_store = r.json()
        assert my_store is not None and "id" in my_store

        for path in ("/store/products", "/store/services", "/store/orders", "/store/bookings"):
            r = s.get(f"{API}{path}", timeout=30)
            assert r.status_code == 200, f"{path} failed: {r.text}"
            assert isinstance(r.json(), list)

    def test_owner_add_product(self):
        s = make_session()
        login(s, OWNER)
        rand = uuid.uuid4().hex[:6]
        payload = {
            "name": f"TEST_Product_{rand}",
            "description": "Test description",
            "price": 50000,
            "discount": 0,
            "stock": 10,
            "sku": f"SKU-{rand}",
            "category_slug": "fresh-fish",
            "images": ["https://images.unsplash.com/photo-1"],
        }
        r = s.post(f"{API}/products", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        prod = r.json()
        assert prod["name"] == payload["name"]

        # verify appears in store products
        r = s.get(f"{API}/store/products", timeout=30)
        assert any(p["id"] == prod["id"] for p in r.json())

    def test_owner_updates_order_status(self):
        # customer creates an order first, then owner (whose store owns the item) updates
        # Since seeded owner store owns seeded products, we can use one of them
        s_cust = make_session()
        login(s_cust, CUSTOMER)

        # get owner's store id
        s_owner = make_session()
        login(s_owner, OWNER)
        my_store = s_owner.get(f"{API}/store/my", timeout=30).json()
        store_id = my_store["id"]

        # find product from owner's store
        store_products = s_owner.get(f"{API}/store/products", timeout=30).json()
        assert len(store_products) > 0
        prod = store_products[0]

        quote = s_cust.post(f"{API}/shipping/quote", json={"destination_city": "Jakarta"}, timeout=30).json()
        opt = next(o for o in quote["options"] if o["courier_code"] == "jne" and o["service"] == "REG")
        order = s_cust.post(f"{API}/orders", json={
            "items": [{"product_id": prod["id"], "qty": 1}],
            "address": {"label": "H", "recipient": "T", "phone": "0812", "line1": "L", "city": "Jakarta", "province": "DKI", "postal_code": "12190"},
            "payment_method": "cod",
            "courier_code": "jne",
            "courier_service": "REG",
            "shipping_cost": opt["cost"],
        }, timeout=30).json()

        r = s_owner.patch(f"{API}/orders/{order['id']}/status?status=processing", timeout=30)
        assert r.status_code == 200
        assert r.json()["status"] == "processing"


# ================== Admin flow ==================
class TestAdmin:
    def test_admin_users_and_role_change(self):
        s = make_session()
        login(s, ADMIN)

        r = s.get(f"{API}/admin/users", timeout=30)
        assert r.status_code == 200
        users = r.json()
        assert len(users) > 0

        # register a temp user and change role
        s2 = make_session()
        rand = uuid.uuid4().hex[:8]
        email = f"TEST_role_{rand}@example.com".lower()
        s2.post(f"{API}/auth/register", json={
            "email": email, "password": "Password@123", "name": "Role Test", "role": "customer",
        }, timeout=30)
        # find user id
        users = s.get(f"{API}/admin/users", timeout=30).json()
        target = next((u for u in users if u["email"] == email), None)
        assert target is not None

        r = s.patch(f"{API}/admin/users/{target['id']}/role?role=store_owner", timeout=30)
        assert r.status_code == 200

        users = s.get(f"{API}/admin/users", timeout=30).json()
        target = next(u for u in users if u["email"] == email)
        assert target["role"] == "store_owner"
