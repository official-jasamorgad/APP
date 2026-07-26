from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import secrets
import uuid
import asyncio
import bcrypt
import jwt
import json
import base64
import hashlib
import hmac
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response, Query, status
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ----------------------------- Config -----------------------------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@marketplace.id")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@12345")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", FRONTEND_URL).split(",") if o.strip()]

# DOKU config
DOKU_BASE_URL = os.environ.get("DOKU_BASE_URL", "https://api-sandbox.doku.com").rstrip("/")
DOKU_CLIENT_ID = os.environ.get("DOKU_CLIENT_ID", "").strip()
DOKU_SECRET_KEY = os.environ.get("DOKU_SECRET_KEY", "").strip()
DOKU_ENABLED = bool(DOKU_CLIENT_ID and DOKU_SECRET_KEY)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Multi Services Marketplace API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("marketplace")

# ----------------------------- Helpers -----------------------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()

def new_id():
    return str(uuid.uuid4())

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60 * 24),  # 1 day for dev convenience
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=60*60*24, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=60*60*24*7, path="/")

def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_role(*roles: str):
    async def dep(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return dep

def strip_id(doc):
    if doc and "_id" in doc:
        doc.pop("_id", None)
    return doc

# ----------------------------- Schemas -----------------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    role: Literal["customer", "store_owner"] = "customer"
    phone: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ForgotIn(BaseModel):
    email: EmailStr

class ResetIn(BaseModel):
    token: str
    new_password: str = Field(min_length=6)

class UpdateProfileIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None

class AddressIn(BaseModel):
    label: str
    recipient: str
    phone: str
    line1: str
    city: str
    province: str
    postal_code: str

class CartItemIn(BaseModel):
    product_id: str
    qty: int = 1

class OrderCreateIn(BaseModel):
    items: List[CartItemIn]
    address: AddressIn
    payment_method: Literal["cod", "doku"]
    courier_code: str
    courier_service: str
    shipping_cost: int
    coupon_code: Optional[str] = None
    doku_method: Optional[str] = None  # va_bca, va_bni, va_bri, va_mandiri, va_permata, credit_card, ovo, dana, shopeepay, linkaja, alfamart, indomaret

class BookingCreateIn(BaseModel):
    service_id: str
    date: str  # YYYY-MM-DD
    time: str  # HH:mm
    notes: Optional[str] = ""
    photos: List[str] = []
    address: Optional[AddressIn] = None

class ReviewIn(BaseModel):
    target_type: Literal["product", "service", "store"]
    target_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = ""

class ProductIn(BaseModel):
    name: str
    description: str
    price: int
    discount: int = 0
    stock: int = 0
    sku: str
    category_slug: str
    images: List[str] = []

class ServiceIn(BaseModel):
    name: str
    description: str
    starting_price: int
    duration_min: int = 60
    service_area: str
    category_slug: str
    technician: str = ""
    images: List[str] = []

class StoreIn(BaseModel):
    name: str
    description: str
    logo: str
    banner: str
    address: str
    contact: str
    whatsapp: str

class CouponValidateIn(BaseModel):
    code: str
    subtotal: int

class ShippingQuoteIn(BaseModel):
    origin_city: str = "Jakarta"
    destination_city: str
    weight_grams: int = 1000

# ----------------------------- Auth -----------------------------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "id": new_id(),
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name,
        "role": payload.role,
        "phone": payload.phone or "",
        "avatar": "",
        "addresses": [],
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    access = create_access_token(user_doc["id"], email, payload.role)
    refresh = create_refresh_token(user_doc["id"])
    set_auth_cookies(response, access, refresh)
    user_doc.pop("password_hash")
    user_doc.pop("_id", None)
    return user_doc

@api.post("/auth/login")
async def login(payload: LoginIn, request: Request, response: Response):
    email = payload.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("locked_until"):
        try:
            locked_until = datetime.fromisoformat(attempt["locked_until"])
            if datetime.now(timezone.utc) < locked_until:
                raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
        except Exception:
            pass

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": now_iso()}},
            upsert=True,
        )
        current = await db.login_attempts.find_one({"identifier": identifier})
        if current and current.get("count", 0) >= 5:
            locked = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
            await db.login_attempts.update_one({"identifier": identifier}, {"$set": {"locked_until": locked, "count": 0}})
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    access = create_access_token(user["id"], email, user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return user

@api.post("/auth/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    access = create_access_token(user["id"], user["email"], user["role"])
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=60*60*24, path="/")
    return {"ok": True}

@api.post("/auth/forgot-password")
async def forgot_password(payload: ForgotIn):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if user:
        token = secrets.token_urlsafe(32)
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        await db.password_reset_tokens.insert_one({
            "id": new_id(),
            "user_id": user["id"],
            "token": token,
            "expires_at": expires_at,
            "used": False,
            "created_at": now_iso(),
        })
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        logger.info(f"[PASSWORD RESET] {email} -> {reset_link}")
    return {"ok": True, "message": "If the email exists, a reset link was sent."}

@api.post("/auth/reset-password")
async def reset_password(payload: ResetIn):
    doc = await db.password_reset_tokens.find_one({"token": payload.token})
    if not doc or doc.get("used"):
        raise HTTPException(status_code=400, detail="Invalid or used token")
    try:
        expires_at = datetime.fromisoformat(doc["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="Token expired")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid token")
    await db.users.update_one({"id": doc["user_id"]}, {"$set": {"password_hash": hash_password(payload.new_password)}})
    await db.password_reset_tokens.update_one({"token": payload.token}, {"$set": {"used": True}})
    return {"ok": True}

@api.patch("/auth/profile")
async def update_profile(payload: UpdateProfileIn, user: dict = Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated

@api.post("/auth/addresses")
async def add_address(payload: AddressIn, user: dict = Depends(get_current_user)):
    addr = payload.model_dump()
    addr["id"] = new_id()
    await db.users.update_one({"id": user["id"]}, {"$push": {"addresses": addr}})
    return addr

# ----------------------------- Categories -----------------------------
@api.get("/categories")
async def list_categories(type: Optional[str] = None):
    q = {"type": type} if type in ("product", "service") else {}
    docs = await db.categories.find(q, {"_id": 0}).to_list(1000)
    return docs

# ----------------------------- Stores -----------------------------
@api.get("/stores")
async def list_stores(q: Optional[str] = None, limit: int = 50):
    filt = {}
    if q:
        filt["name"] = {"$regex": q, "$options": "i"}
    docs = await db.stores.find(filt, {"_id": 0}).to_list(limit)
    return docs

@api.get("/stores/{store_id}")
async def get_store(store_id: str):
    doc = await db.stores.find_one({"id": store_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Store not found")
    return doc

@api.post("/stores")
async def create_store(payload: StoreIn, user: dict = Depends(require_role("store_owner", "admin"))):
    existing = await db.stores.find_one({"owner_id": user["id"]})
    if existing:
        raise HTTPException(400, "You already own a store")
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["owner_id"] = user["id"]
    doc["rating"] = 0
    doc["review_count"] = 0
    doc["created_at"] = now_iso()
    await db.stores.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.patch("/stores/{store_id}")
async def update_store(store_id: str, payload: StoreIn, user: dict = Depends(get_current_user)):
    store = await db.stores.find_one({"id": store_id})
    if not store:
        raise HTTPException(404, "Store not found")
    if user["role"] != "admin" and store["owner_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    await db.stores.update_one({"id": store_id}, {"$set": payload.model_dump()})
    return await db.stores.find_one({"id": store_id}, {"_id": 0})

# ----------------------------- Products -----------------------------
@api.get("/products")
async def list_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    store_id: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    sort: Optional[str] = None,
    limit: int = 60,
):
    filt = {}
    if q:
        filt["name"] = {"$regex": q, "$options": "i"}
    if category:
        filt["category_slug"] = category
    if store_id:
        filt["store_id"] = store_id
    if min_price is not None or max_price is not None:
        pf = {}
        if min_price is not None:
            pf["$gte"] = min_price
        if max_price is not None:
            pf["$lte"] = max_price
        filt["price"] = pf
    cursor = db.products.find(filt, {"_id": 0})
    if sort == "price_asc":
        cursor = cursor.sort("price", 1)
    elif sort == "price_desc":
        cursor = cursor.sort("price", -1)
    elif sort == "rating":
        cursor = cursor.sort("rating", -1)
    else:
        cursor = cursor.sort("created_at", -1)
    return await cursor.to_list(limit)

@api.get("/products/featured")
async def featured_products(limit: int = 8):
    docs = await db.products.find({"featured": True}, {"_id": 0}).limit(limit).to_list(limit)
    if not docs:
        docs = await db.products.find({}, {"_id": 0}).sort("rating", -1).limit(limit).to_list(limit)
    return docs

@api.get("/products/{pid}")
async def get_product(pid: str):
    doc = await db.products.find_one({"id": pid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Product not found")
    return doc

@api.post("/products")
async def create_product(payload: ProductIn, user: dict = Depends(require_role("store_owner", "admin"))):
    store = await db.stores.find_one({"owner_id": user["id"]}) if user["role"] == "store_owner" else None
    if user["role"] == "store_owner" and not store:
        raise HTTPException(400, "Create a store first")
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["store_id"] = store["id"] if store else "admin"
    doc["rating"] = 0
    doc["review_count"] = 0
    doc["featured"] = False
    doc["created_at"] = now_iso()
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.patch("/products/{pid}")
async def update_product(pid: str, payload: ProductIn, user: dict = Depends(get_current_user)):
    prod = await db.products.find_one({"id": pid})
    if not prod:
        raise HTTPException(404, "Product not found")
    if user["role"] != "admin":
        store = await db.stores.find_one({"id": prod["store_id"]})
        if not store or store["owner_id"] != user["id"]:
            raise HTTPException(403, "Forbidden")
    await db.products.update_one({"id": pid}, {"$set": payload.model_dump()})
    return await db.products.find_one({"id": pid}, {"_id": 0})

@api.delete("/products/{pid}")
async def delete_product(pid: str, user: dict = Depends(get_current_user)):
    prod = await db.products.find_one({"id": pid})
    if not prod:
        raise HTTPException(404, "Product not found")
    if user["role"] != "admin":
        store = await db.stores.find_one({"id": prod["store_id"]})
        if not store or store["owner_id"] != user["id"]:
            raise HTTPException(403, "Forbidden")
    await db.products.delete_one({"id": pid})
    return {"ok": True}

# ----------------------------- Services -----------------------------
@api.get("/services")
async def list_services(
    q: Optional[str] = None,
    category: Optional[str] = None,
    store_id: Optional[str] = None,
    limit: int = 60,
):
    filt = {}
    if q:
        filt["name"] = {"$regex": q, "$options": "i"}
    if category:
        filt["category_slug"] = category
    if store_id:
        filt["store_id"] = store_id
    return await db.services.find(filt, {"_id": 0}).sort("created_at", -1).to_list(limit)

@api.get("/services/featured")
async def featured_services(limit: int = 6):
    docs = await db.services.find({"featured": True}, {"_id": 0}).limit(limit).to_list(limit)
    if not docs:
        docs = await db.services.find({}, {"_id": 0}).sort("rating", -1).limit(limit).to_list(limit)
    return docs

@api.get("/services/{sid}")
async def get_service(sid: str):
    doc = await db.services.find_one({"id": sid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Service not found")
    return doc

@api.post("/services")
async def create_service(payload: ServiceIn, user: dict = Depends(require_role("store_owner", "admin"))):
    store = await db.stores.find_one({"owner_id": user["id"]}) if user["role"] == "store_owner" else None
    if user["role"] == "store_owner" and not store:
        raise HTTPException(400, "Create a store first")
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["store_id"] = store["id"] if store else "admin"
    doc["rating"] = 0
    doc["review_count"] = 0
    doc["featured"] = False
    doc["created_at"] = now_iso()
    await db.services.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ----------------------------- Wishlist -----------------------------
@api.get("/wishlist")
async def get_wishlist(user: dict = Depends(get_current_user)):
    items = await db.wishlist.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    product_ids = [i["product_id"] for i in items]
    products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0}).to_list(500)
    return products

@api.post("/wishlist/{product_id}")
async def add_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    await db.wishlist.update_one(
        {"user_id": user["id"], "product_id": product_id},
        {"$set": {"user_id": user["id"], "product_id": product_id, "created_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}

@api.delete("/wishlist/{product_id}")
async def remove_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    await db.wishlist.delete_one({"user_id": user["id"], "product_id": product_id})
    return {"ok": True}

# ----------------------------- Shipping (mock) -----------------------------
COURIERS = [
    {"code": "jne", "name": "JNE"},
    {"code": "jnt", "name": "J&T Express"},
    {"code": "sicepat", "name": "SiCepat"},
    {"code": "pos", "name": "POS Indonesia"},
    {"code": "anteraja", "name": "AnterAja"},
    {"code": "ninja", "name": "Ninja Xpress"},
    {"code": "tiki", "name": "TIKI"},
    {"code": "lion", "name": "Lion Parcel"},
    {"code": "sap", "name": "SAP Express"},
    {"code": "idexpress", "name": "ID Express"},
]

@api.post("/shipping/quote")
async def shipping_quote(payload: ShippingQuoteIn):
    base = 8000 + (payload.weight_grams // 1000) * 3000
    city_key = payload.destination_city.lower().strip()
    city_factor = 1.0
    if city_key in ("jakarta", "tangerang", "bekasi", "depok", "bogor"):
        city_factor = 1.0
    elif city_key in ("bandung", "semarang", "surabaya"):
        city_factor = 1.3
    else:
        city_factor = 1.7
    options = []
    for c in COURIERS:
        options.append({
            "courier_code": c["code"],
            "courier_name": c["name"],
            "service": "REG",
            "cost": int(base * city_factor),
            "etd": "2-4 days",
        })
        options.append({
            "courier_code": c["code"],
            "courier_name": c["name"],
            "service": "SAMEDAY",
            "cost": int(base * city_factor * 2.5),
            "etd": "Same day",
        })
    return {"options": options}

# ----------------------------- Coupons -----------------------------
@api.post("/coupons/validate")
async def validate_coupon(payload: CouponValidateIn):
    code = payload.code.upper()
    coupon = await db.coupons.find_one({"code": code}, {"_id": 0})
    if not coupon:
        raise HTTPException(404, "Coupon not found")
    if payload.subtotal < coupon.get("min_amount", 0):
        raise HTTPException(400, f"Minimum order Rp {coupon.get('min_amount', 0):,}")
    if coupon["discount_type"] == "percent":
        discount = int(payload.subtotal * coupon["discount_value"] / 100)
    else:
        discount = int(coupon["discount_value"])
    return {"coupon": coupon, "discount": discount}

# ----------------------------- DOKU Payment Gateway -----------------------------
DOKU_METHODS = {
    "va_bca":     {"path": "/bca-virtual-account/v2/payment-code",     "kind": "va",       "channel": "VIRTUAL_ACCOUNT_BCA",     "label": "Virtual Account BCA"},
    "va_bni":     {"path": "/bni-virtual-account/v2/payment-code",     "kind": "va",       "channel": "VIRTUAL_ACCOUNT_BNI",     "label": "Virtual Account BNI"},
    "va_bri":     {"path": "/bri-virtual-account/v2/payment-code",     "kind": "va",       "channel": "VIRTUAL_ACCOUNT_BRI",     "label": "Virtual Account BRI"},
    "va_mandiri": {"path": "/mandiri-virtual-account/v2/payment-code", "kind": "va",       "channel": "VIRTUAL_ACCOUNT_MANDIRI", "label": "Virtual Account Mandiri"},
    "va_permata": {"path": "/permata-virtual-account/v2/payment-code", "kind": "va",       "channel": "VIRTUAL_ACCOUNT_PERMATA", "label": "Virtual Account Permata"},
    "credit_card":{"path": "/credit-card/v1/payment-page",             "kind": "card",     "channel": "CREDIT_CARD",             "label": "Kartu Kredit / Debit"},
    "alfamart":   {"path": "/alfa-virtual-account/v2/payment-code",    "kind": "o2o",      "channel": "ALFA",                    "label": "Alfamart"},
    "indomaret":  {"path": "/indomaret-online-to-offline/v2/payment-code","kind": "o2o",   "channel": "INDOMARET",               "label": "Indomaret"},
    "ovo":        {"path": "/ovo-emoney/v1/payment",                   "kind": "ewallet",  "channel": "EMONEY_OVO",              "label": "OVO"},
    "dana":       {"path": "/dana-emoney/v2/payment",                  "kind": "ewallet",  "channel": "EMONEY_DANA",             "label": "DANA"},
    "shopeepay":  {"path": "/shopeepay-emoney/v2/payment",             "kind": "ewallet",  "channel": "EMONEY_SHOPEEPAY",        "label": "ShopeePay"},
    "linkaja":    {"path": "/linkaja-emoney/v2/ServiceRequestPayment", "kind": "ewallet",  "channel": "EMONEY_LINKAJA",          "label": "LinkAja"},
}


def _doku_sign(request_id: str, request_ts: str, request_target: str, body: bytes) -> str:
    digest = base64.b64encode(hashlib.sha256(body).digest()).decode()
    component = [
        f"Client-Id:{DOKU_CLIENT_ID}",
        f"Request-Id:{request_id}",
        f"Request-Timestamp:{request_ts}",
        f"Request-Target:{request_target}",
        f"Digest:{digest}",
    ]
    raw = "\n".join(component)
    sig = hmac.new(DOKU_SECRET_KEY.encode(), raw.encode(), hashlib.sha256).digest()
    return "HMACSHA256=" + base64.b64encode(sig).decode()


def _doku_ts() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _simulated_doku_instructions(order_id: str, amount: int, method: str) -> dict:
    """Deterministic fake instructions used when DOKU keys are not configured."""
    cfg = DOKU_METHODS.get(method, {"kind": "va", "label": method})
    invoice = order_id[:8].upper()
    if cfg["kind"] == "va":
        va = "8" + "".join([c for c in order_id if c.isdigit()])[:11].ljust(11, "0")
        return {
            "simulated": True,
            "method": method,
            "method_label": cfg["label"],
            "status": "PENDING",
            "amount": amount,
            "expiry_minutes": 60,
            "virtual_account_number": va[:12],
            "invoice_number": invoice,
        }
    if cfg["kind"] == "o2o":
        return {
            "simulated": True,
            "method": method,
            "method_label": cfg["label"],
            "status": "PENDING",
            "amount": amount,
            "payment_code": invoice + "01",
            "invoice_number": invoice,
        }
    if cfg["kind"] == "card":
        return {
            "simulated": True,
            "method": method,
            "method_label": cfg["label"],
            "status": "PENDING",
            "amount": amount,
            "payment_url": f"{FRONTEND_URL}/orders/{order_id}?sim=cc",
            "invoice_number": invoice,
        }
    # ewallet
    return {
        "simulated": True,
        "method": method,
        "method_label": cfg["label"],
        "status": "PENDING",
        "amount": amount,
        "deeplink": f"{FRONTEND_URL}/orders/{order_id}?sim={method}",
        "qr_url": f"https://api.qrserver.com/v1/create-qr-code/?data=DOKU-SIM-{invoice}&size=240x240",
        "invoice_number": invoice,
    }


async def create_doku_payment(order: dict, doku_method: str) -> dict:
    cfg = DOKU_METHODS.get(doku_method)
    if not cfg:
        raise HTTPException(400, f"Unsupported DOKU method: {doku_method}")

    if not DOKU_ENABLED:
        logger.warning("DOKU_CLIENT_ID/SECRET_KEY not configured — returning simulated payment instructions.")
        return _simulated_doku_instructions(order["id"], order["total"], doku_method)

    invoice = order["id"][:16]
    address = order["address"]
    customer = {
        "name": address.get("recipient") or "Customer",
        "email": None,
        "phone": address.get("phone"),
    }
    if cfg["kind"] == "va" or cfg["kind"] == "o2o":
        payload = {
            "order": {"invoice_number": invoice, "amount": order["total"]},
            "virtual_account_info": {"expired_time": 60, "billing_type": "FIXED"},
            "customer": customer,
        }
    elif cfg["kind"] == "card":
        payload = {
            "order": {"invoice_number": invoice, "amount": order["total"], "callback_url": f"{FRONTEND_URL}/orders/{order['id']}"},
            "payment": {"type": "SALE"},
            "customer": customer,
        }
    else:  # ewallet
        payload = {
            "order": {"invoice_number": invoice, "amount": order["total"]},
            "customer": customer,
        }

    body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode()
    request_id = str(uuid.uuid4())
    ts = _doku_ts()
    headers = {
        "Client-Id": DOKU_CLIENT_ID,
        "Request-Id": request_id,
        "Request-Timestamp": ts,
        "Signature": _doku_sign(request_id, ts, cfg["path"], body),
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=25) as c:
            r = await c.post(f"{DOKU_BASE_URL}{cfg['path']}", content=body, headers=headers)
        if r.status_code >= 400:
            logger.warning(f"DOKU error {r.status_code}: {r.text[:400]}")
            return _simulated_doku_instructions(order["id"], order["total"], doku_method)
        data = r.json()
    except Exception as ex:
        logger.exception(f"DOKU request failed: {ex}")
        return _simulated_doku_instructions(order["id"], order["total"], doku_method)

    return {
        "simulated": False,
        "method": doku_method,
        "method_label": cfg["label"],
        "status": "PENDING",
        "amount": order["total"],
        "invoice_number": invoice,
        "virtual_account_number": (data.get("virtual_account_info") or {}).get("virtual_account_number"),
        "payment_code": (data.get("online_to_offline_info") or {}).get("payment_code"),
        "payment_url": (data.get("credit_card_payment_page") or {}).get("url") or (data.get("payment") or {}).get("url"),
        "deeplink": (data.get("emoney_payment") or {}).get("redirect_url_http"),
        "qr_url": (data.get("emoney_payment") or {}).get("qr_url") or (data.get("additional_info") or {}).get("qr_url"),
        "raw": data,
    }


# ----------------------------- Orders -----------------------------
PAYMENT_EXPIRY_MINUTES = 60


async def _restore_stock(order: dict):
    for it in order.get("items", []):
        pid = it.get("product_id")
        qty = it.get("qty") or 0
        if pid and qty:
            await db.products.update_one({"id": pid}, {"$inc": {"stock": qty}})


async def _cancel_order(order: dict, reason: str, auto: bool = False):
    """Cancel an order, restore stock, add timeline entry, and notify the user."""
    if order.get("status") in ("cancelled", "delivered"):
        return order
    await _restore_stock(order)
    note = ("Auto-cancelled: " if auto else "Cancelled: ") + reason
    await db.orders.update_one(
        {"id": order["id"]},
        {
            "$set": {"status": "cancelled", "cancelled_at": now_iso(), "cancel_reason": reason},
            "$push": {"timeline": {"status": "cancelled", "at": now_iso(), "note": note}},
        },
    )
    await db.notifications.insert_one({
        "id": new_id(),
        "user_id": order["user_id"],
        "title": "Order cancelled",
        "body": f"Order #{order['id'][:8]} was {'auto-cancelled' if auto else 'cancelled'} — {reason}",
        "type": "order",
        "ref_id": order["id"],
        "read": False,
        "created_at": now_iso(),
    })
    return await db.orders.find_one({"id": order["id"]}, {"_id": 0})


@api.post("/orders")
async def create_order(payload: OrderCreateIn, user: dict = Depends(get_current_user)):
    items_full = []
    subtotal = 0
    for it in payload.items:
        p = await db.products.find_one({"id": it.product_id}, {"_id": 0})
        if not p:
            raise HTTPException(404, f"Product {it.product_id} not found")
        if p.get("stock", 0) < it.qty:
            raise HTTPException(400, f"Stok {p['name']} tidak mencukupi (tersisa {p.get('stock', 0)})")
        effective_price = p["price"] - int(p["price"] * p.get("discount", 0) / 100)
        line_total = effective_price * it.qty
        subtotal += line_total
        items_full.append({
            "product_id": p["id"],
            "name": p["name"],
            "image": (p.get("images") or [""])[0],
            "price": effective_price,
            "qty": it.qty,
            "store_id": p["store_id"],
            "line_total": line_total,
        })
    discount = 0
    coupon_applied = None
    if payload.coupon_code:
        coupon = await db.coupons.find_one({"code": payload.coupon_code.upper()}, {"_id": 0})
        if coupon and subtotal >= coupon.get("min_amount", 0):
            if coupon["discount_type"] == "percent":
                discount = int(subtotal * coupon["discount_value"] / 100)
            else:
                discount = int(coupon["discount_value"])
            coupon_applied = coupon["code"]
    total = subtotal + payload.shipping_cost - discount
    # Determine payment expiry (only for DOKU VA / o2o where user must complete offline payment)
    expires_at = None
    if payload.payment_method == "doku":
        method_cfg = DOKU_METHODS.get(payload.doku_method or "")
        if method_cfg and method_cfg["kind"] in ("va", "o2o"):
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=PAYMENT_EXPIRY_MINUTES)).isoformat()
    order = {
        "id": new_id(),
        "user_id": user["id"],
        "items": items_full,
        "address": payload.address.model_dump(),
        "payment_method": payload.payment_method,
        "courier_code": payload.courier_code,
        "courier_service": payload.courier_service,
        "shipping_cost": payload.shipping_cost,
        "subtotal": subtotal,
        "discount": discount,
        "coupon_code": coupon_applied,
        "total": total,
        "status": "pending",
        "expires_at": expires_at,
        "tracking_number": f"AWB{new_id().split('-')[0].upper()}",
        "timeline": [{"status": "pending", "at": now_iso(), "note": "Order placed"}],
        "created_at": now_iso(),
    }
    await db.orders.insert_one(order)
    # Decrement stock (will be restored on cancel)
    for it in items_full:
        await db.products.update_one({"id": it["product_id"]}, {"$inc": {"stock": -it["qty"]}})
    # Payment gateway integration
    if payload.payment_method == "doku":
        method = payload.doku_method or "va_bca"
        instructions = await create_doku_payment(order, method)
        order["doku_instructions"] = instructions
        order["doku_method"] = method
        await db.orders.update_one({"id": order["id"]}, {"$set": {"doku_instructions": instructions, "doku_method": method}})
    await db.notifications.insert_one({
        "id": new_id(),
        "user_id": user["id"],
        "title": "Order placed",
        "body": f"Your order #{order['id'][:8]} has been placed.",
        "type": "order",
        "ref_id": order["id"],
        "read": False,
        "created_at": now_iso(),
    })
    order.pop("_id", None)
    return order


@api.post("/orders/{oid}/cancel")
async def cancel_order_endpoint(oid: str, user: dict = Depends(get_current_user)):
    doc = await db.orders.find_one({"id": oid})
    if not doc:
        raise HTTPException(404, "Order not found")
    # Only order owner, admin, or store owner selling the items can cancel
    if user["role"] != "admin" and doc["user_id"] != user["id"]:
        store = await db.stores.find_one({"owner_id": user["id"]})
        if not store or not any(i.get("store_id") == store["id"] for i in doc["items"]):
            raise HTTPException(403, "Forbidden")
    if doc["status"] not in ("pending", "paid", "processing"):
        raise HTTPException(400, "Order cannot be cancelled in current status")
    updated = await _cancel_order(doc, reason="Cancelled by user")
    return updated

@api.get("/orders")
async def list_orders(user: dict = Depends(get_current_user)):
    return await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api.get("/orders/{oid}")
async def get_order(oid: str, user: dict = Depends(get_current_user)):
    doc = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Order not found")
    if user["role"] not in ("admin",) and doc["user_id"] != user["id"]:
        # store owner can see their own orders
        store = await db.stores.find_one({"owner_id": user["id"]})
        if not store or not any(i.get("store_id") == store["id"] for i in doc["items"]):
            raise HTTPException(403, "Forbidden")
    return doc

@api.patch("/orders/{oid}/status")
async def update_order_status(oid: str, status_value: str = Query(..., alias="status"), user: dict = Depends(get_current_user)):
    if user["role"] not in ("admin", "store_owner"):
        raise HTTPException(403, "Forbidden")
    if status_value not in ("pending", "paid", "processing", "shipped", "delivered", "cancelled"):
        raise HTTPException(400, "Invalid status")
    doc = await db.orders.find_one({"id": oid})
    if not doc:
        raise HTTPException(404, "Order not found")
    await db.orders.update_one({"id": oid}, {"$set": {"status": status_value}, "$push": {"timeline": {"status": status_value, "at": now_iso(), "note": ""}}})
    return await db.orders.find_one({"id": oid}, {"_id": 0})

@api.get("/payments/doku/methods")
async def doku_methods():
    return {
        "enabled": DOKU_ENABLED,
        "simulated": not DOKU_ENABLED,
        "methods": [
            {"code": code, "label": m["label"], "kind": m["kind"]}
            for code, m in DOKU_METHODS.items()
        ],
    }


@api.post("/payments/doku/webhook")
async def doku_webhook(request: Request):
    raw = await request.body()
    headers = request.headers
    # Verify signature when DOKU is configured
    if DOKU_ENABLED:
        expected = _doku_sign(
            headers.get("Request-Id", ""),
            headers.get("Request-Timestamp", ""),
            "/api/payments/doku/webhook",
            raw,
        )
        if headers.get("Signature") != expected:
            logger.warning("DOKU webhook signature mismatch")
            raise HTTPException(401, "Invalid signature")
    try:
        body = json.loads(raw or b"{}")
    except Exception:
        raise HTTPException(400, "Invalid JSON body")

    invoice = ((body.get("order") or {}).get("invoice_number")) or body.get("invoice_number")
    tx_status = ((body.get("transaction") or {}).get("status")) \
        or ((body.get("virtual_account_info") or {}).get("status")) \
        or body.get("status")

    if invoice:
        # invoice_number is derived from first 16 chars of order id
        order = await db.orders.find_one({"id": {"$regex": f"^{invoice}"}})
        if order:
            new_status = "paid" if str(tx_status).upper() in ("SUCCESS", "PAID", "COMPLETED", "SETTLEMENT") else "pending"
            await db.orders.update_one(
                {"id": order["id"]},
                {
                    "$set": {"status": new_status, "doku_webhook": body},
                    "$push": {"timeline": {"status": new_status, "at": now_iso(), "note": f"DOKU webhook: {tx_status}"}},
                },
            )
            await db.notifications.insert_one({
                "id": new_id(),
                "user_id": order["user_id"],
                "title": "Payment updated",
                "body": f"Order #{order['id'][:8]} is now {new_status}.",
                "type": "payment",
                "ref_id": order["id"],
                "read": False,
                "created_at": now_iso(),
            })
    return {"ok": True}


# ----------------------------- Bookings -----------------------------
@api.post("/bookings")
async def create_booking(payload: BookingCreateIn, user: dict = Depends(get_current_user)):
    svc = await db.services.find_one({"id": payload.service_id}, {"_id": 0})
    if not svc:
        raise HTTPException(404, "Service not found")
    doc = {
        "id": new_id(),
        "user_id": user["id"],
        "service_id": svc["id"],
        "service_name": svc["name"],
        "store_id": svc["store_id"],
        "date": payload.date,
        "time": payload.time,
        "notes": payload.notes or "",
        "photos": payload.photos or [],
        "address": payload.address.model_dump() if payload.address else None,
        "starting_price": svc["starting_price"],
        "status": "pending",
        "created_at": now_iso(),
    }
    await db.bookings.insert_one(doc)
    await db.notifications.insert_one({
        "id": new_id(),
        "user_id": user["id"],
        "title": "Booking submitted",
        "body": f"Your booking for {svc['name']} was submitted.",
        "type": "booking",
        "ref_id": doc["id"],
        "read": False,
        "created_at": now_iso(),
    })
    doc.pop("_id", None)
    return doc

@api.get("/bookings")
async def list_bookings(user: dict = Depends(get_current_user)):
    return await db.bookings.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api.patch("/bookings/{bid}/status")
async def update_booking_status(bid: str, status_value: str = Query(..., alias="status"), user: dict = Depends(get_current_user)):
    if user["role"] not in ("admin", "store_owner"):
        raise HTTPException(403, "Forbidden")
    if status_value not in ("pending", "confirmed", "in_progress", "completed", "cancelled"):
        raise HTTPException(400, "Invalid status")
    await db.bookings.update_one({"id": bid}, {"$set": {"status": status_value}})
    return await db.bookings.find_one({"id": bid}, {"_id": 0})

# ----------------------------- Reviews -----------------------------
@api.post("/reviews")
async def create_review(payload: ReviewIn, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["user_id"] = user["id"]
    doc["user_name"] = user["name"]
    doc["created_at"] = now_iso()
    await db.reviews.insert_one(doc)
    # Update target rating
    target_col = {"product": db.products, "service": db.services, "store": db.stores}[payload.target_type]
    all_reviews = await db.reviews.find({"target_type": payload.target_type, "target_id": payload.target_id}).to_list(10000)
    if all_reviews:
        avg = sum(r["rating"] for r in all_reviews) / len(all_reviews)
        await target_col.update_one({"id": payload.target_id}, {"$set": {"rating": round(avg, 1), "review_count": len(all_reviews)}})
    doc.pop("_id", None)
    return doc

@api.get("/reviews")
async def list_reviews(target_type: str, target_id: str):
    docs = await db.reviews.find({"target_type": target_type, "target_id": target_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs

# ----------------------------- Notifications -----------------------------
@api.get("/notifications")
async def list_notifications(user: dict = Depends(get_current_user)):
    return await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)

@api.patch("/notifications/{nid}/read")
async def read_notification(nid: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": nid, "user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}

# ----------------------------- Banners -----------------------------
@api.get("/banners")
async def list_banners():
    return await db.banners.find({"active": True}, {"_id": 0}).to_list(20)

# ----------------------------- Dashboard analytics -----------------------------
@api.get("/dashboard/customer")
async def customer_dashboard(user: dict = Depends(get_current_user)):
    orders = await db.orders.count_documents({"user_id": user["id"]})
    bookings = await db.bookings.count_documents({"user_id": user["id"]})
    wishlist = await db.wishlist.count_documents({"user_id": user["id"]})
    return {"orders": orders, "bookings": bookings, "wishlist": wishlist}

@api.get("/dashboard/store")
async def store_dashboard(user: dict = Depends(require_role("store_owner", "admin"))):
    store = await db.stores.find_one({"owner_id": user["id"]}, {"_id": 0})
    if not store:
        return {"has_store": False}
    products = await db.products.count_documents({"store_id": store["id"]})
    services = await db.services.count_documents({"store_id": store["id"]})
    orders = await db.orders.find({"items.store_id": store["id"]}, {"_id": 0}).to_list(2000)
    total_revenue = 0
    monthly = {}
    for o in orders:
        for it in o["items"]:
            if it.get("store_id") == store["id"]:
                total_revenue += it["line_total"]
                mkey = o["created_at"][:7]
                monthly[mkey] = monthly.get(mkey, 0) + it["line_total"]
    monthly_series = [{"month": k, "revenue": v} for k, v in sorted(monthly.items())]
    bookings = await db.bookings.count_documents({"store_id": store["id"]})
    return {
        "has_store": True,
        "store": store,
        "products": products,
        "services": services,
        "orders": len(orders),
        "bookings": bookings,
        "revenue": total_revenue,
        "monthly_revenue": monthly_series,
    }

@api.get("/dashboard/admin")
async def admin_dashboard(user: dict = Depends(require_role("admin"))):
    users = await db.users.count_documents({})
    customers = await db.users.count_documents({"role": "customer"})
    owners = await db.users.count_documents({"role": "store_owner"})
    stores = await db.stores.count_documents({})
    products = await db.products.count_documents({})
    services = await db.services.count_documents({})
    orders_docs = await db.orders.find({}, {"_id": 0}).to_list(5000)
    revenue = sum(o["total"] for o in orders_docs)
    by_status = {}
    for o in orders_docs:
        by_status[o["status"]] = by_status.get(o["status"], 0) + 1
    monthly = {}
    for o in orders_docs:
        mkey = o["created_at"][:7]
        monthly[mkey] = monthly.get(mkey, 0) + o["total"]
    return {
        "users": users,
        "customers": customers,
        "store_owners": owners,
        "stores": stores,
        "products": products,
        "services": services,
        "orders": len(orders_docs),
        "revenue": revenue,
        "orders_by_status": [{"status": k, "count": v} for k, v in by_status.items()],
        "monthly_revenue": [{"month": k, "revenue": v} for k, v in sorted(monthly.items())],
    }

@api.get("/admin/users")
async def admin_users(user: dict = Depends(require_role("admin"))):
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(2000)

@api.patch("/admin/users/{uid}/role")
async def admin_change_role(uid: str, role: str = Query(...), user: dict = Depends(require_role("admin"))):
    if role not in ("customer", "store_owner", "admin"):
        raise HTTPException(400, "Invalid role")
    await db.users.update_one({"id": uid}, {"$set": {"role": role}})
    return {"ok": True}

@api.get("/admin/orders")
async def admin_orders(user: dict = Depends(require_role("admin"))):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api.get("/store/orders")
async def store_orders(user: dict = Depends(require_role("store_owner", "admin"))):
    store = await db.stores.find_one({"owner_id": user["id"]})
    if not store:
        return []
    return await db.orders.find({"items.store_id": store["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api.get("/store/bookings")
async def store_bookings(user: dict = Depends(require_role("store_owner", "admin"))):
    store = await db.stores.find_one({"owner_id": user["id"]})
    if not store:
        return []
    return await db.bookings.find({"store_id": store["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api.get("/store/products")
async def store_products(user: dict = Depends(require_role("store_owner", "admin"))):
    store = await db.stores.find_one({"owner_id": user["id"]})
    if not store:
        return []
    return await db.products.find({"store_id": store["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api.get("/store/services")
async def store_services(user: dict = Depends(require_role("store_owner", "admin"))):
    store = await db.stores.find_one({"owner_id": user["id"]})
    if not store:
        return []
    return await db.services.find({"store_id": store["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api.get("/store/my")
async def my_store(user: dict = Depends(require_role("store_owner", "admin"))):
    return await db.stores.find_one({"owner_id": user["id"]}, {"_id": 0})

# ----------------------------- Search -----------------------------
@api.get("/search")
async def search(q: str = Query(...)):
    regex = {"$regex": q, "$options": "i"}
    products = await db.products.find({"name": regex}, {"_id": 0}).limit(10).to_list(10)
    services = await db.services.find({"name": regex}, {"_id": 0}).limit(10).to_list(10)
    stores = await db.stores.find({"name": regex}, {"_id": 0}).limit(10).to_list(10)
    return {"products": products, "services": services, "stores": stores}

@api.get("/health")
async def health():
    return {"ok": True, "time": now_iso()}


# ============================================================================
# EMERGENT GOOGLE AUTH
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
# ============================================================================
class GoogleSessionIn(BaseModel):
    session_id: str


@api.post("/auth/google/session")
async def google_session_login(payload: GoogleSessionIn, response: Response):
    """Exchange Emergent session_id for a user session. Called by frontend AuthCallback."""
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": payload.session_id},
            )
        if r.status_code >= 400:
            raise HTTPException(401, "Invalid Google session")
        data = r.json()
    except HTTPException:
        raise
    except Exception as ex:
        logger.exception(f"Emergent Auth exchange failed: {ex}")
        raise HTTPException(502, "Google auth service unavailable")

    email = (data.get("email") or "").lower()
    if not email:
        raise HTTPException(400, "Google session missing email")

    user = await db.users.find_one({"email": email})
    if not user:
        # Auto-create as customer, mark verified
        new_user = {
            "id": new_id(),
            "email": email,
            "password_hash": hash_password(secrets.token_urlsafe(24)),  # random unusable
            "name": data.get("name") or email.split("@")[0],
            "role": "customer",
            "phone": "",
            "avatar": data.get("picture") or "",
            "addresses": [],
            "email_verified": True,
            "google_id": data.get("id"),
            "created_at": now_iso(),
        }
        await db.users.insert_one(new_user)
        user = new_user
    else:
        # Update linkage
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"google_id": data.get("id"), "email_verified": True, "avatar": user.get("avatar") or data.get("picture") or ""}},
        )

    access = create_access_token(user["id"], email, user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return user


# ============================================================================
# OTP VERIFICATION (email-based, code logged to backend in dev)
# ============================================================================
class OtpSendIn(BaseModel):
    email: EmailStr


class OtpVerifyIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


@api.post("/auth/otp/send")
async def otp_send(payload: OtpSendIn):
    email = payload.email.lower()
    code = f"{secrets.randbelow(1000000):06d}"
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    await db.otp_codes.delete_many({"email": email})
    await db.otp_codes.insert_one({
        "id": new_id(),
        "email": email,
        "code": code,
        "expires_at": expires_at,
        "attempts": 0,
        "used": False,
        "created_at": now_iso(),
    })
    logger.info(f"[OTP] {email} -> code: {code} (expires 10 min)")
    return {"ok": True, "message": "OTP sent to email"}


@api.post("/auth/otp/verify")
async def otp_verify(payload: OtpVerifyIn):
    email = payload.email.lower()
    doc = await db.otp_codes.find_one({"email": email, "used": False})
    if not doc:
        raise HTTPException(400, "No active OTP. Please request a new one.")
    if doc.get("attempts", 0) >= 5:
        raise HTTPException(429, "Too many attempts. Request a new code.")
    try:
        expires_at = datetime.fromisoformat(doc["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(400, "OTP expired. Request a new code.")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(400, "Invalid OTP")
    if doc["code"] != payload.code:
        await db.otp_codes.update_one({"id": doc["id"]}, {"$inc": {"attempts": 1}})
        raise HTTPException(400, "Incorrect code")
    await db.otp_codes.update_one({"id": doc["id"]}, {"$set": {"used": True}})
    await db.users.update_one({"email": email}, {"$set": {"email_verified": True}})
    return {"ok": True, "verified": True}


# ============================================================================
# DIGITAL PRODUCTS (game top-up, pulsa, PLN, e-wallet)
# ============================================================================
DIGITAL_CATEGORIES = [
    {"slug": "games",   "name_en": "Game Top-Up",     "name_id": "Top-Up Game",      "icon": "Gamepad2",   "image": "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600"},
    {"slug": "pulsa",   "name_en": "Prepaid Credit",  "name_id": "Pulsa",            "icon": "PhoneCall",  "image": "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600"},
    {"slug": "listrik", "name_en": "Electricity Token","name_id": "Token Listrik PLN","icon": "Zap",       "image": "https://images.unsplash.com/photo-1611365892117-bce3ceeb3ea3?w=600"},
    {"slug": "ewallet", "name_en": "E-Wallet Top-Up", "name_id": "Isi Ulang E-Wallet","icon": "Wallet",    "image": "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600"},
]


class DigitalOrderIn(BaseModel):
    product_id: str
    target_id: str  # game user_id / phone / PLN meter / e-wallet phone
    target_meta: Optional[str] = None  # e.g. game server ID
    payment_method: Literal["cod", "doku"] = "doku"
    doku_method: Optional[str] = None


@api.get("/digital/categories")
async def digital_categories():
    return DIGITAL_CATEGORIES


@api.get("/digital/products")
async def digital_products(category: Optional[str] = None):
    filt = {}
    if category:
        filt["category_slug"] = category
    return await db.digital_products.find(filt, {"_id": 0}).to_list(1000)


@api.get("/digital/products/{pid}")
async def digital_product(pid: str):
    doc = await db.digital_products.find_one({"id": pid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Product not found")
    return doc


@api.post("/digital/order")
async def digital_order(payload: DigitalOrderIn, user: dict = Depends(get_current_user)):
    p = await db.digital_products.find_one({"id": payload.product_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Product not found")
    order = {
        "id": new_id(),
        "user_id": user["id"],
        "type": "digital",
        "category_slug": p["category_slug"],
        "product_id": p["id"],
        "product_name": p["name"],
        "provider": p["provider"],
        "target_id": payload.target_id,
        "target_meta": payload.target_meta,
        "price": p["price"],
        "total": p["price"],
        "subtotal": p["price"],
        "shipping_cost": 0,
        "discount": 0,
        "status": "pending",
        "payment_method": payload.payment_method,
        "created_at": now_iso(),
        "timeline": [{"status": "pending", "at": now_iso(), "note": "Digital order placed"}],
    }
    expires_at = None
    if payload.payment_method == "doku":
        method_cfg = DOKU_METHODS.get(payload.doku_method or "")
        if method_cfg and method_cfg["kind"] in ("va", "o2o"):
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=PAYMENT_EXPIRY_MINUTES)).isoformat()
    order["expires_at"] = expires_at
    await db.digital_orders.insert_one(order)
    if payload.payment_method == "doku":
        # Reuse DOKU payment
        fake_order = {**order, "total": order["total"], "address": {"recipient": user["name"], "phone": user.get("phone") or ""}}
        instructions = await create_doku_payment(fake_order, payload.doku_method or "va_bca")
        order["doku_instructions"] = instructions
        order["doku_method"] = payload.doku_method
        await db.digital_orders.update_one({"id": order["id"]}, {"$set": {"doku_instructions": instructions, "doku_method": payload.doku_method}})
    await db.notifications.insert_one({
        "id": new_id(),
        "user_id": user["id"],
        "title": "Digital top-up placed",
        "body": f"{p['name']} → {payload.target_id}",
        "type": "digital",
        "ref_id": order["id"],
        "read": False,
        "created_at": now_iso(),
    })
    order.pop("_id", None)
    return order


@api.get("/digital/orders")
async def list_digital_orders(user: dict = Depends(get_current_user)):
    return await db.digital_orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.get("/digital/orders/{oid}")
async def get_digital_order(oid: str, user: dict = Depends(get_current_user)):
    doc = await db.digital_orders.find_one({"id": oid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Order not found")
    if user["role"] != "admin" and doc["user_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    return doc


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------- Startup: indexes + seed -----------------------------
async def ensure_indexes():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.stores.create_index("id", unique=True)
    await db.products.create_index("id", unique=True)
    await db.services.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.bookings.create_index("id", unique=True)
    await db.login_attempts.create_index("identifier")

async def seed_admin():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "id": new_id(),
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Marketplace Admin",
            "role": "admin",
            "phone": "",
            "avatar": "",
            "addresses": [],
            "created_at": now_iso(),
        })
        logger.info(f"Seeded admin {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})

async def seed_demo():
    from seed_data import seed_categories, seed_stores_products_services, seed_banners, seed_coupons, seed_demo_users, seed_digital_products
    await seed_categories(db)
    await seed_demo_users(db, hash_password)
    await seed_stores_products_services(db)
    await seed_banners(db)
    await seed_coupons(db)
    await seed_digital_products(db)

async def expire_pending_orders_loop():
    """Background task: every 60s, auto-cancel pending DOKU orders past expires_at and restore stock."""
    while True:
        try:
            now = datetime.now(timezone.utc).isoformat()
            cursor = db.orders.find({"status": "pending", "expires_at": {"$ne": None, "$lt": now}})
            async for doc in cursor:
                await _cancel_order(doc, reason=f"Payment not received within {PAYMENT_EXPIRY_MINUTES} minutes", auto=True)
                logger.info(f"Auto-cancelled expired order {doc['id'][:8]}")
        except Exception as ex:
            logger.exception(f"expire_pending_orders_loop error: {ex}")
        await asyncio.sleep(60)


@app.on_event("startup")
async def on_start():
    await ensure_indexes()
    await seed_admin()
    await seed_demo()
    asyncio.create_task(expire_pending_orders_loop())

@app.on_event("shutdown")
async def on_shut():
    client.close()
