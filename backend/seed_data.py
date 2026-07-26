"""Idempotent seed data for the Multi Services Marketplace."""
import uuid
from datetime import datetime, timezone


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def new_id():
    return str(uuid.uuid4())


PRODUCT_CATEGORIES = [
    {"slug": "fresh-fish", "name_en": "Fresh Fish", "name_id": "Ikan Segar", "icon": "Fish", "image": "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=400"},
    {"slug": "cosmetics", "name_en": "Cosmetics", "name_id": "Kosmetik", "icon": "Sparkles", "image": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400"},
    {"slug": "electronics", "name_en": "Electronics", "name_id": "Elektronik", "icon": "Cpu", "image": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400"},
    {"slug": "fashion", "name_en": "Fashion", "name_id": "Fesyen", "icon": "Shirt", "image": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400"},
    {"slug": "home-appliances", "name_en": "Home Appliances", "name_id": "Peralatan Rumah", "icon": "Refrigerator", "image": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"},
    {"slug": "grocery", "name_en": "Grocery", "name_id": "Sembako", "icon": "ShoppingBasket", "image": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"},
    {"slug": "furniture", "name_en": "Furniture", "name_id": "Furnitur", "icon": "Armchair", "image": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400"},
    {"slug": "automotive", "name_en": "Automotive", "name_id": "Otomotif", "icon": "Car", "image": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400"},
    {"slug": "agriculture", "name_en": "Agriculture", "name_id": "Pertanian", "icon": "Wheat", "image": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400"},
    {"slug": "health", "name_en": "Health", "name_id": "Kesehatan", "icon": "HeartPulse", "image": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400"},
    {"slug": "accessories", "name_en": "Accessories", "name_id": "Aksesoris", "icon": "Watch", "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"},
    {"slug": "other-products", "name_en": "Other Products", "name_id": "Produk Lainnya", "icon": "Package", "image": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400"},
]

SERVICE_CATEGORIES = [
    {"slug": "electronics-repair", "name_en": "Electronics Repair", "name_id": "Servis Elektronik", "icon": "Wrench", "image": "https://images.pexels.com/photos/34404168/pexels-photo-34404168.jpeg?w=400"},
    {"slug": "mobile-repair", "name_en": "Mobile Repair", "name_id": "Servis HP", "icon": "Smartphone", "image": "https://images.unsplash.com/photo-1585338447937-7082f8fc763d?w=400"},
    {"slug": "ac-service", "name_en": "AC Service", "name_id": "Servis AC", "icon": "Snowflake", "image": "https://images.unsplash.com/photo-1631545308456-b6d7db06e6ba?w=400"},
    {"slug": "computer-repair", "name_en": "Computer Repair", "name_id": "Servis Komputer", "icon": "Laptop", "image": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400"},
    {"slug": "motorcycle-service", "name_en": "Motorcycle Service", "name_id": "Servis Motor", "icon": "Bike", "image": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400"},
    {"slug": "car-service", "name_en": "Car Service", "name_id": "Servis Mobil", "icon": "Car", "image": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400"},
    {"slug": "plumbing", "name_en": "Plumbing", "name_id": "Ledeng", "icon": "Droplets", "image": "https://images.pexels.com/photos/37340086/pexels-photo-37340086.jpeg?w=400"},
    {"slug": "electrical", "name_en": "Electrical", "name_id": "Listrik", "icon": "Zap", "image": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400"},
    {"slug": "cleaning-service", "name_en": "Cleaning Service", "name_id": "Cleaning Service", "icon": "Sparkle", "image": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400"},
    {"slug": "home-service", "name_en": "Home Service", "name_id": "Layanan Rumah", "icon": "Home", "image": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"},
    {"slug": "delivery-service", "name_en": "Delivery Service", "name_id": "Pengiriman", "icon": "Truck", "image": "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=400"},
    {"slug": "other-services", "name_en": "Other Services", "name_id": "Layanan Lainnya", "icon": "Package", "image": "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400"},
]


async def seed_categories(db):
    if await db.categories.count_documents({}) >= (len(PRODUCT_CATEGORIES) + len(SERVICE_CATEGORIES)):
        return
    await db.categories.delete_many({})
    docs = []
    for c in PRODUCT_CATEGORIES:
        docs.append({"id": new_id(), "type": "product", **c})
    for c in SERVICE_CATEGORIES:
        docs.append({"id": new_id(), "type": "service", **c})
    await db.categories.insert_many(docs)


async def seed_demo_users(db, hash_password):
    """Seed one demo customer and one demo store owner (idempotent)."""
    demo_users = [
        {"email": "customer@marketplace.id", "password": "Customer@12345", "name": "Budi Santoso", "role": "customer", "phone": "+6281234567890"},
        {"email": "owner@marketplace.id", "password": "Owner@12345", "name": "Sari Wijaya", "role": "store_owner", "phone": "+6281298765432"},
    ]
    for u in demo_users:
        existing = await db.users.find_one({"email": u["email"]})
        if not existing:
            await db.users.insert_one({
                "id": new_id(),
                "email": u["email"],
                "password_hash": hash_password(u["password"]),
                "name": u["name"],
                "role": u["role"],
                "phone": u["phone"],
                "avatar": "",
                "addresses": [{
                    "id": new_id(),
                    "label": "Rumah",
                    "recipient": u["name"],
                    "phone": u["phone"],
                    "line1": "Jl. Sudirman No. 123",
                    "city": "Jakarta",
                    "province": "DKI Jakarta",
                    "postal_code": "10220",
                }],
                "created_at": now_iso(),
            })


STORES_SEED = [
    {
        "name": "Segar Laut Nusantara",
        "description": "Ikan dan seafood segar langsung dari nelayan pantai utara.",
        "logo": "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=200",
        "banner": "https://images.pexels.com/photos/36745909/pexels-photo-36745909.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "address": "Pasar Ikan Muara Baru, Jakarta Utara",
        "contact": "+62 812 3456 7890",
        "whatsapp": "6281234567890",
        "categories": ["fresh-fish", "grocery"],
    },
    {
        "name": "Glow Beauty Studio",
        "description": "Kosmetik lokal dan internasional pilihan, plus layanan makeup.",
        "logo": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200",
        "banner": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200",
        "address": "Jl. Kemang Raya No. 45, Jakarta Selatan",
        "contact": "+62 813 8888 1111",
        "whatsapp": "6281388881111",
        "categories": ["cosmetics", "health"],
    },
    {
        "name": "Elektronik Prima",
        "description": "Toko elektronik terpercaya dan pusat servis resmi.",
        "logo": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200",
        "banner": "https://images.pexels.com/photos/34404168/pexels-photo-34404168.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "address": "Mangga Dua Square Lt. 2, Jakarta",
        "contact": "+62 811 9999 2222",
        "whatsapp": "6281199992222",
        "categories": ["electronics", "electronics-repair", "computer-repair", "mobile-repair"],
    },
    {
        "name": "Rumah Furnitur Kayu",
        "description": "Furnitur kayu solid handmade dari pengrajin Jepara.",
        "logo": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=200",
        "banner": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200",
        "address": "Jl. Panglima Sudirman 88, Jepara",
        "contact": "+62 851 7777 3333",
        "whatsapp": "6285177773333",
        "categories": ["furniture", "home-appliances"],
    },
    {
        "name": "Bengkel Motor Barokah",
        "description": "Servis motor terpercaya, sparepart original, tune up harian.",
        "logo": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200",
        "banner": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200",
        "address": "Jl. Fatmawati No. 12, Jakarta Selatan",
        "contact": "+62 856 4444 5555",
        "whatsapp": "6285644445555",
        "categories": ["motorcycle-service", "automotive"],
    },
    {
        "name": "Fashion Batik Nusa",
        "description": "Batik tulis dan cap khas Solo, Yogyakarta, Pekalongan.",
        "logo": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=200",
        "banner": "https://images.pexels.com/photos/32549955/pexels-photo-32549955.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "address": "Malioboro Mall Lt. 1, Yogyakarta",
        "contact": "+62 878 2222 6666",
        "whatsapp": "6287822226666",
        "categories": ["fashion", "accessories"],
    },
]


PRODUCT_TEMPLATES = {
    "fresh-fish": [
        ("Ikan Kakap Merah Segar 1kg", 85000, 8, "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=600"),
        ("Udang Vaname Fresh 500g", 62000, 5, "https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=600"),
        ("Cumi Segar 1kg", 78000, 0, "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600"),
        ("Ikan Salmon Fillet 300g", 145000, 12, "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600"),
    ],
    "cosmetics": [
        ("Lip Cream Matte Local Brand", 45000, 10, "https://images.unsplash.com/photo-1631214540553-ff044a3ff1d4?w=600"),
        ("Serum Vitamin C 30ml", 125000, 15, "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600"),
        ("Sunscreen SPF 50 PA++++", 89000, 0, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600"),
        ("BB Cushion 15g", 165000, 20, "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600"),
    ],
    "electronics": [
        ("Wireless Earbuds Pro", 385000, 15, "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600"),
        ("Smart LED TV 43 inch", 4250000, 8, "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600"),
        ("Powerbank 20000mAh Fast Charge", 285000, 0, "https://images.unsplash.com/photo-1609592806955-d0c1c8c1c0f0?w=600"),
        ("Bluetooth Speaker Waterproof", 425000, 12, "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600"),
    ],
    "fashion": [
        ("Batik Tulis Pria Lengan Panjang", 385000, 10, "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600"),
        ("Kemeja Linen Wanita", 225000, 0, "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=600"),
        ("Celana Chino Slim Fit", 189000, 15, "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600"),
        ("Dress Casual Musim Kemarau", 275000, 5, "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600"),
    ],
    "home-appliances": [
        ("Rice Cooker 1.8L Digital", 585000, 10, "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600"),
        ("Blender 2L Heavy Duty", 425000, 0, "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600"),
        ("Setrika Uap 2200W", 315000, 8, "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600"),
    ],
    "grocery": [
        ("Beras Premium 5kg", 82000, 0, "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600"),
        ("Minyak Goreng 2L", 38000, 0, "https://images.unsplash.com/photo-1626197031507-c17099753214?w=600"),
        ("Gula Pasir 1kg", 15500, 0, "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=600"),
    ],
    "furniture": [
        ("Kursi Kayu Jati Solid", 1250000, 0, "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600"),
        ("Meja Makan 6 Kursi", 4850000, 10, "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600"),
        ("Rak Buku Minimalis", 685000, 0, "https://images.unsplash.com/photo-1503602642458-232111445657?w=600"),
    ],
    "automotive": [
        ("Oli Mesin Motor 1L", 65000, 0, "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600"),
        ("Ban Motor Tubeless", 385000, 12, "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600"),
    ],
    "accessories": [
        ("Jam Tangan Kayu Handmade", 425000, 15, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"),
        ("Dompet Kulit Asli", 285000, 0, "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600"),
    ],
    "health": [
        ("Vitamin C 1000mg 30 tab", 85000, 0, "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600"),
        ("Thermometer Digital Infrared", 165000, 20, "https://images.unsplash.com/photo-1583912267550-d6c7d0ea82a9?w=600"),
    ],
}


SERVICE_TEMPLATES = {
    "electronics-repair": [("Servis TV & Audio", 85000, "https://images.pexels.com/photos/34404168/pexels-photo-34404168.jpeg?w=600")],
    "mobile-repair": [("Ganti LCD HP", 350000, "https://images.unsplash.com/photo-1585338447937-7082f8fc763d?w=600"), ("Servis HP Software", 75000, "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=600")],
    "ac-service": [("Cuci AC 1PK", 85000, "https://images.unsplash.com/photo-1631545308456-b6d7db06e6ba?w=600"), ("Isi Freon AC", 285000, "https://images.unsplash.com/photo-1631545308456-b6d7db06e6ba?w=600")],
    "computer-repair": [("Servis Laptop Umum", 150000, "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600"), ("Install Ulang Windows", 100000, "https://images.unsplash.com/photo-1587614313085-5da51cebd8ac?w=600")],
    "motorcycle-service": [("Servis Motor Reguler", 65000, "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600"), ("Ganti Oli + Filter", 95000, "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600")],
    "car-service": [("Tune Up Mobil", 385000, "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600")],
    "plumbing": [("Perbaikan Pipa Bocor", 125000, "https://images.pexels.com/photos/37340086/pexels-photo-37340086.jpeg?w=600"), ("Pasang Kran & Shower", 85000, "https://images.pexels.com/photos/37340086/pexels-photo-37340086.jpeg?w=600")],
    "electrical": [("Instalasi Listrik Rumah", 285000, "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600")],
    "cleaning-service": [("Deep Cleaning Rumah", 385000, "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600"), ("General Cleaning Kantor", 685000, "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600")],
    "home-service": [("Tukang Serba Bisa", 150000, "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600")],
    "delivery-service": [("Kurir Instant Same-day", 25000, "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=600")],
}


async def seed_stores_products_services(db):
    if await db.stores.count_documents({}) >= len(STORES_SEED):
        return
    # Find/attach owner for first store to the demo store owner user
    owner_user = await db.users.find_one({"email": "owner@marketplace.id"})
    owner_id = owner_user["id"] if owner_user else "system"

    await db.stores.delete_many({})
    await db.products.delete_many({})
    await db.services.delete_many({})

    for idx, s in enumerate(STORES_SEED):
        store_id = new_id()
        # First store owned by demo owner; others by system
        this_owner = owner_id if idx == 0 else f"system-{idx}"
        store_doc = {
            "id": store_id,
            "owner_id": this_owner,
            "name": s["name"],
            "description": s["description"],
            "logo": s["logo"],
            "banner": s["banner"],
            "address": s["address"],
            "contact": s["contact"],
            "whatsapp": s["whatsapp"],
            "rating": round(4.2 + (idx * 0.1) % 0.8, 1),
            "review_count": 50 + idx * 12,
            "created_at": now_iso(),
        }
        await db.stores.insert_one(store_doc)

        featured_flag = True
        for cat in s["categories"]:
            if cat in PRODUCT_TEMPLATES:
                for pname, price, disc, img in PRODUCT_TEMPLATES[cat]:
                    await db.products.insert_one({
                        "id": new_id(),
                        "store_id": store_id,
                        "sku": f"SKU-{new_id()[:6].upper()}",
                        "name": pname,
                        "description": f"{pname}. Kualitas terbaik langsung dari {s['name']}.",
                        "price": price,
                        "discount": disc,
                        "stock": 50,
                        "category_slug": cat,
                        "images": [img],
                        "rating": round(4.0 + (hash(pname) % 10) / 10, 1),
                        "review_count": 12 + (hash(pname) % 40),
                        "featured": featured_flag,
                        "created_at": now_iso(),
                    })
                    featured_flag = False
            if cat in SERVICE_TEMPLATES:
                for sname, price, img in SERVICE_TEMPLATES[cat]:
                    await db.services.insert_one({
                        "id": new_id(),
                        "store_id": store_id,
                        "name": sname,
                        "description": f"{sname} profesional oleh teknisi berpengalaman.",
                        "starting_price": price,
                        "duration_min": 90,
                        "service_area": s["address"].split(",")[-1].strip(),
                        "category_slug": cat,
                        "technician": "Tim Teknisi Bersertifikat",
                        "images": [img],
                        "rating": round(4.2 + (hash(sname) % 8) / 10, 1),
                        "review_count": 8 + (hash(sname) % 25),
                        "featured": True,
                        "created_at": now_iso(),
                    })


async def seed_banners(db):
    if await db.banners.count_documents({}) > 0:
        return
    banners = [
        {
            "id": new_id(),
            "title": "Belanja Semua, Servis Semua",
            "subtitle": "Satu aplikasi untuk produk dan layanan lokal.",
            "image": "https://images.pexels.com/photos/36745909/pexels-photo-36745909.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "cta": "Jelajahi",
            "link": "/products",
            "active": True,
        },
        {
            "id": new_id(),
            "title": "Diskon Kilat 30%",
            "subtitle": "Gunakan kode HEMAT30 di pembayaran.",
            "image": "https://images.pexels.com/photos/30883971/pexels-photo-30883971.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "cta": "Klaim Sekarang",
            "link": "/products?category=cosmetics",
            "active": True,
        },
    ]
    await db.banners.insert_many(banners)


async def seed_coupons(db):
    if await db.coupons.count_documents({}) > 0:
        return
    coupons = [
        {"id": new_id(), "code": "HEMAT30", "discount_type": "percent", "discount_value": 30, "min_amount": 100000, "active": True},
        {"id": new_id(), "code": "GRATISONGKIR", "discount_type": "flat", "discount_value": 20000, "min_amount": 50000, "active": True},
        {"id": new_id(), "code": "NEWUSER", "discount_type": "percent", "discount_value": 15, "min_amount": 0, "active": True},
    ]
    await db.coupons.insert_many(coupons)


# ============================================================================
# DIGITAL PRODUCTS (games, pulsa, PLN, e-wallet)
# ============================================================================
GAME_PROVIDERS = [
    ("Mobile Legends: Bang Bang", "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400",
     [("86 Diamonds", 20000), ("172 Diamonds", 40000), ("257 Diamonds", 58000),
      ("344 Diamonds", 78000), ("706 Diamonds", 155000), ("1412 Diamonds", 305000)]),
    ("Free Fire", "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400",
     [("70 Diamonds", 10000), ("140 Diamonds", 20000), ("355 Diamonds", 50000),
      ("720 Diamonds", 100000), ("1450 Diamonds", 200000)]),
    ("PUBG Mobile", "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400",
     [("60 UC", 15000), ("325 UC", 75000), ("660 UC", 149000), ("1800 UC", 385000)]),
    ("Genshin Impact", "https://images.unsplash.com/photo-1616627451515-d3466a6ecd44?w=400",
     [("60 Genesis Crystals", 16000), ("300 Genesis Crystals", 79000), ("980 Genesis Crystals", 249000)]),
    ("Valorant", "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400",
     [("125 VP", 15000), ("420 VP", 50000), ("700 VP", 79000), ("1375 VP", 149000)]),
    ("Honor of Kings", "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=400",
     [("40 Tokens", 12000), ("225 Tokens", 65000), ("500 Tokens", 145000)]),
]

PULSA_PROVIDERS = [
    ("Telkomsel", "https://images.unsplash.com/photo-1583912267550-d6c7d0ea82a9?w=400"),
    ("Indosat Ooredoo", "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=400"),
    ("XL Axiata", "https://images.unsplash.com/photo-1585338447937-7082f8fc763d?w=400"),
    ("Tri (3)", "https://images.unsplash.com/photo-1520923642038-b4259acecbd7?w=400"),
    ("Smartfren", "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400"),
    ("Axis", "https://images.unsplash.com/photo-1591808216268-ce0b82787efe?w=400"),
]
PULSA_DENOMS = [
    ("Pulsa 5.000", 6500), ("Pulsa 10.000", 11500), ("Pulsa 15.000", 16500),
    ("Pulsa 20.000", 21500), ("Pulsa 25.000", 26500), ("Pulsa 50.000", 51000),
    ("Pulsa 100.000", 100500), ("Pulsa 150.000", 150500), ("Pulsa 200.000", 200500),
]

PLN_DENOMS = [
    ("Token PLN 20.000", 21000), ("Token PLN 50.000", 51000), ("Token PLN 100.000", 101000),
    ("Token PLN 200.000", 201000), ("Token PLN 500.000", 501000), ("Token PLN 1.000.000", 1001000),
]

EWALLET_PROVIDERS = [
    ("GoPay", "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=400"),
    ("OVO", "https://images.unsplash.com/photo-1601987077677-5346c0c57d3f?w=400"),
    ("DANA", "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400"),
    ("ShopeePay", "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400"),
    ("LinkAja", "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400"),
]
EWALLET_DENOMS = [
    ("Top-Up 20.000", 22000), ("Top-Up 50.000", 52000), ("Top-Up 100.000", 102000),
    ("Top-Up 200.000", 202000), ("Top-Up 500.000", 502000), ("Top-Up 1.000.000", 1002000),
]


async def seed_digital_products(db):
    if await db.digital_products.count_documents({}) > 0:
        return
    docs = []
    for game, img, denoms in GAME_PROVIDERS:
        for label, price in denoms:
            docs.append({
                "id": new_id(),
                "category_slug": "games",
                "provider": game,
                "name": f"{game} — {label}",
                "denom_label": label,
                "price": price,
                "image": img,
                "target_hint": "Masukkan User ID game Anda (dan Server ID jika diperlukan).",
                "created_at": now_iso(),
            })
    for provider, img in PULSA_PROVIDERS:
        for label, price in PULSA_DENOMS:
            docs.append({
                "id": new_id(),
                "category_slug": "pulsa",
                "provider": provider,
                "name": f"{provider} — {label}",
                "denom_label": label,
                "price": price,
                "image": img,
                "target_hint": "Masukkan nomor HP tujuan (contoh: 081234567890).",
                "created_at": now_iso(),
            })
    for label, price in PLN_DENOMS:
        docs.append({
            "id": new_id(),
            "category_slug": "listrik",
            "provider": "PLN Prepaid",
            "name": f"PLN Prepaid — {label}",
            "denom_label": label,
            "price": price,
            "image": "https://images.unsplash.com/photo-1611365892117-bce3ceeb3ea3?w=400",
            "target_hint": "Masukkan nomor meter/ID Pelanggan (11 digit).",
            "created_at": now_iso(),
        })
    for provider, img in EWALLET_PROVIDERS:
        for label, price in EWALLET_DENOMS:
            docs.append({
                "id": new_id(),
                "category_slug": "ewallet",
                "provider": provider,
                "name": f"{provider} — {label}",
                "denom_label": label,
                "price": price,
                "image": img,
                "target_hint": f"Masukkan nomor HP terdaftar di {provider}.",
                "created_at": now_iso(),
            })
    await db.digital_products.insert_many(docs)
