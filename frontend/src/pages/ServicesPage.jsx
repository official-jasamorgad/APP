import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import ServiceCard from "@/components/ServiceCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServicesPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const q = params.get("q") || "";
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/categories?type=service").then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (q) p.set("q", q);
    api.get(`/services?${p.toString()}`).then((r) => setServices(r.data)).finally(() => setLoading(false));
  }, [category, q]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" data-testid="services-page">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">Services</h1>
        <p className="text-sm text-muted-foreground">{services.length} services</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setParam("category", "")}
          className={`rounded-full border border-border px-3 py-1.5 text-xs font-medium ${!category ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        >All</button>
        {categories.map((c) => (
          <button
            key={c.id}
            data-testid={`svc-filter-${c.slug}`}
            onClick={() => setParam("category", c.slug)}
            className={`rounded-full border border-border px-3 py-1.5 text-xs font-medium ${
              category === c.slug ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {c.name_en}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : services.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => <ServiceCard key={s.id} service={s} index={i} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No services found.
        </div>
      )}
    </div>
  );
}
