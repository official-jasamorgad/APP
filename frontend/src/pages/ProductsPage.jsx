import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { SlidersHorizontal } from "lucide-react";

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const category = params.get("category") || "";
  const q = params.get("q") || "";
  const sort = params.get("sort") || "";
  const minP = params.get("min") || "";
  const maxP = params.get("max") || "";

  useEffect(() => {
    api.get("/categories?type=product").then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (q) p.set("q", q);
    if (sort) p.set("sort", sort);
    if (minP) p.set("min_price", minP);
    if (maxP) p.set("max_price", maxP);
    api.get(`/products?${p.toString()}`).then((r) => setProducts(r.data)).finally(() => setLoading(false));
  }, [category, q, sort, minP, maxP]);

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" data-testid="products-page">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} items</p>
        </div>
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          data-testid="sort-select"
          className="rounded-full border border-border bg-background px-4 py-2 text-sm"
        >
          <option value="">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="space-y-6" data-testid="filters-sidebar">
          <div>
            <h3 className="mb-2 flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wider">
              <SlidersHorizontal className="h-4 w-4" /> Category
            </h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setParam("category", "")}
                className={`rounded-lg px-3 py-1.5 text-left text-sm ${!category ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  data-testid={`filter-cat-${c.slug}`}
                  onClick={() => setParam("category", c.slug)}
                  className={`rounded-lg px-3 py-1.5 text-left text-sm ${
                    category === c.slug ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  {c.name_en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 font-heading text-sm font-bold uppercase tracking-wider">Price (Rp)</h3>
            <div className="flex gap-2">
              <input
                data-testid="min-price"
                placeholder="Min"
                value={minP}
                onChange={(e) => setParam("min", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              />
              <input
                data-testid="max-price"
                placeholder="Max"
                value={maxP}
                onChange={(e) => setParam("max", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        </aside>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
            </div>
          ) : products.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              No products found. Try adjusting filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
