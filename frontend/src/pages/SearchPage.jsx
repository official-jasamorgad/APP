import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import ServiceCard from "@/components/ServiceCard";
import StoreCard from "@/components/StoreCard";

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [res, setRes] = useState({ products: [], services: [], stores: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    api.get(`/search?q=${encodeURIComponent(q)}`).then((r) => setRes(r.data)).finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" data-testid="search-page">
      <h1 className="mb-6 font-heading text-3xl font-bold sm:text-4xl">Results for "{q}"</h1>
      {loading ? <p>Loading...</p> : (
        <div className="space-y-10">
          {res.products.length > 0 && (
            <section>
              <h2 className="mb-3 font-heading text-xl font-bold">Products</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {res.products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            </section>
          )}
          {res.services.length > 0 && (
            <section>
              <h2 className="mb-3 font-heading text-xl font-bold">Services</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {res.services.map((s, i) => <ServiceCard key={s.id} service={s} index={i} />)}
              </div>
            </section>
          )}
          {res.stores.length > 0 && (
            <section>
              <h2 className="mb-3 font-heading text-xl font-bold">Stores</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {res.stores.map((s, i) => <StoreCard key={s.id} store={s} index={i} />)}
              </div>
            </section>
          )}
          {res.products.length + res.services.length + res.stores.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing matched. Try another keyword.</p>
          )}
        </div>
      )}
    </div>
  );
}
