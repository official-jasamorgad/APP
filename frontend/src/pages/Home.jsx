import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { tr } from "@/lib/i18n";
import ProductCard from "@/components/ProductCard";
import ServiceCard from "@/components/ServiceCard";
import StoreCard from "@/components/StoreCard";
import { ArrowRight, Search, ShieldCheck, Truck, Sparkles, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const TESTIMONIALS = [
  { name: "Rina Amelia", role: "Ibu rumah tangga · Jakarta", quote: "Belanja ikan segar dan booking servis AC di satu tempat. Sangat memudahkan!", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200" },
  { name: "Ahmad Fauzi", role: "Freelancer · Bandung", quote: "Teknisi cepat datang, harga transparan. PasarKita jadi andalan saya sekarang.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
  { name: "Siti Nurhaliza", role: "Owner Warung · Surabaya", quote: "Sebagai pemilik toko, dashboard analitiknya bikin saya paham penjualan tiap bulan.", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200" },
];

export default function Home() {
  const { lang } = useApp();
  const t = (k) => tr(lang, k);
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [stores, setStores] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/categories"),
      api.get("/products/featured"),
      api.get("/services/featured"),
      api.get("/stores"),
      api.get("/banners"),
    ])
      .then(([c, p, s, st, b]) => {
        setCategories(c.data);
        setProducts(p.data);
        setServices(s.data);
        setStores(st.data);
        setBanners(b.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const productCats = categories.filter((c) => c.type === "product");
  const serviceCats = categories.filter((c) => c.type === "service");

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="dot-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3 md:py-16">
          <div className="md:col-span-2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              <span>Multi Services Marketplace · Indonesia</span>
            </div>
            <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {t("hero.headline")}
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              {t("hero.sub")}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
              }}
              className="mt-6 max-w-xl"
              data-testid="hero-search-form"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  data-testid="hero-search-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("search.placeholder")}
                  className="w-full rounded-full border border-border bg-background py-4 pl-12 pr-32 text-sm outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  data-testid="hero-search-submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/products" data-testid="hero-cta-products" className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:opacity-90">
                {t("hero.cta.products")} <ArrowRight className="ml-1 inline h-4 w-4" />
              </Link>
              <Link to="/services" data-testid="hero-cta-services" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
                {t("hero.cta.services")}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" />Trusted local stores</div>
              <div className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-primary" />JNE, J&T, SiCepat & more</div>
              <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-primary" />Verified reviews</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 overflow-hidden rounded-3xl border border-border">
              <img src="https://images.pexels.com/photos/36745909/pexels-photo-36745909.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="market" className="h-56 w-full object-cover" />
            </div>
            <div className="overflow-hidden rounded-2xl border border-border">
              <img src="https://images.pexels.com/photos/34404168/pexels-photo-34404168.jpeg?w=800" alt="repair" className="h-32 w-full object-cover" />
            </div>
            <div className="overflow-hidden rounded-2xl border border-border">
              <img src="https://images.pexels.com/photos/32549955/pexels-photo-32549955.jpeg?w=800" alt="fashion" className="h-32 w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Digital Top-Up quick section */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" data-testid="digital-section">
        <SectionHeader title="Top-Up Instan" more="/digital" moreLabel={t("common.viewAll")} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { slug: "games", label: lang === "id" ? "Top-Up Game" : "Game Top-Up", img: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600", desc: "ML, FF, PUBG, Genshin +" },
            { slug: "pulsa", label: "Pulsa", img: "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600", desc: "Telkomsel, XL, Indosat +" },
            { slug: "listrik", label: "Token PLN", img: "https://images.unsplash.com/photo-1611365892117-bce3ceeb3ea3?w=600", desc: "20k – 1jt Prepaid" },
            { slug: "ewallet", label: "E-Wallet", img: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600", desc: "GoPay, OVO, DANA +" },
          ].map((d, i) => (
            <Link
              key={d.slug}
              to={`/digital?category=${d.slug}`}
              data-testid={`digital-quick-${d.slug}`}
              className="fade-up group relative overflow-hidden rounded-2xl border border-border"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="aspect-[4/3] bg-muted">
                <img src={d.img} alt={d.label} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <div className="font-heading text-base font-bold">{d.label}</div>
                <div className="text-[11px] opacity-90">{d.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Product Categories */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" data-testid="product-categories-section">
        <SectionHeader title={t("section.categories.products")} more="/products" moreLabel={t("common.viewAll")} />
        {loading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {productCats.map((c, i) => (
              <Link
                key={c.id}
                to={`/products?category=${c.slug}`}
                data-testid={`product-cat-${c.slug}`}
                className="fade-up group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
                style={{ animationDelay: `${i * 25}ms` }}
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img src={c.image} alt={c.name_en} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="p-2 text-center">
                  <div className="text-xs font-semibold">{lang === "id" ? c.name_id : c.name_en}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Service Categories */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" data-testid="service-categories-section">
        <SectionHeader title={t("section.categories.services")} more="/services" moreLabel={t("common.viewAll")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {serviceCats.map((c, i) => (
            <Link
              key={c.id}
              to={`/services?category=${c.slug}`}
              data-testid={`service-cat-${c.slug}`}
              className="fade-up group relative overflow-hidden rounded-2xl border border-border"
              style={{ animationDelay: `${i * 25}ms` }}
            >
              <div className="aspect-[4/5] bg-muted">
                <img src={c.image} alt={c.name_en} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <div className="text-[13px] font-bold">{lang === "id" ? c.name_id : c.name_en}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" data-testid="featured-products-section">
        <SectionHeader title={t("section.featured.products")} more="/products" moreLabel={t("common.viewAll")} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)
            : products.slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* Featured Services */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" data-testid="featured-services-section">
        <SectionHeader title={t("section.featured.services")} more="/services" moreLabel={t("common.viewAll")} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
            : services.slice(0, 6).map((s, i) => <ServiceCard key={s.id} service={s} index={i} />)}
        </div>
      </section>

      {/* Popular Stores */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" data-testid="popular-stores-section">
        <SectionHeader title={t("section.stores")} more="/stores" moreLabel={t("common.viewAll")} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.slice(0, 6).map((s, i) => <StoreCard key={s.id} store={s} index={i} />)}
        </div>
      </section>

      {/* Promotions */}
      {banners.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" data-testid="promotions-section">
          <SectionHeader title={t("section.promotions")} />
          <div className="grid gap-4 md:grid-cols-2">
            {banners.map((b) => (
              <div key={b.id} className="fade-up relative overflow-hidden rounded-3xl border border-border">
                <img src={b.image} alt={b.title} className="h-56 w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-center p-6 text-white">
                  <h3 className="font-heading text-2xl font-bold sm:text-3xl">{b.title}</h3>
                  <p className="mt-2 text-sm opacity-90">{b.subtitle}</p>
                  <Link to={b.link} className="mt-4 w-fit rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
                    {b.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" data-testid="testimonials-section">
        <SectionHeader title={t("section.testimonials")} />
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((tm, i) => (
            <div key={tm.name} className="fade-up rounded-2xl border border-border bg-card p-5" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="mb-3 flex items-center gap-3">
                <img src={tm.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <div className="text-sm font-bold">{tm.name}</div>
                  <div className="text-[11px] text-muted-foreground">{tm.role}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">"{tm.quote}"</p>
              <div className="mt-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, more, moreLabel }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <h2 className="font-heading text-2xl font-bold sm:text-3xl">{title}</h2>
      {more && (
        <Link to={more} className="text-sm font-semibold text-primary hover:underline">
          {moreLabel} <ArrowRight className="ml-1 inline h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
