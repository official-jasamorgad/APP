import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/format";
import { Gamepad2, PhoneCall, Zap, Wallet, ArrowRight, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const ICONS = { games: Gamepad2, pulsa: PhoneCall, listrik: Zap, ewallet: Wallet };

export default function DigitalHub() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "games";
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const { lang, currency } = useApp();

  useEffect(() => {
    api.get("/digital/categories").then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    api.get(`/digital/products?category=${category}`).then((r) => setProducts(r.data));
  }, [category]);

  const groupedByProvider = products
    .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))
    .reduce((acc, p) => {
      (acc[p.provider] = acc[p.provider] || []).push(p);
      return acc;
    }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" data-testid="digital-hub-page">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">Digital Top-Up</h1>
        <p className="text-sm text-muted-foreground">Top-up game, pulsa, token PLN, dan e-wallet — instan & aman.</p>
      </div>

      <Tabs value={category} onValueChange={(v) => setParams({ category: v })}>
        <TabsList data-testid="digital-tabs" className="mb-4">
          {categories.map((c) => {
            const Icon = ICONS[c.slug] || Gamepad2;
            return (
              <TabsTrigger key={c.slug} value={c.slug} data-testid={`digital-tab-${c.slug}`}>
                <Icon className="mr-1.5 h-3.5 w-3.5" /> {lang === "id" ? c.name_id : c.name_en}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mb-4 relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            data-testid="digital-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nominal atau provider..."
            className="w-full rounded-full border border-border bg-background py-2 pl-10 pr-4 text-sm"
          />
        </div>

        {categories.map((c) => (
          <TabsContent key={c.slug} value={c.slug} className="mt-4">
            <div className="space-y-6">
              {Object.entries(groupedByProvider).map(([provider, items]) => (
                <section key={provider} data-testid={`provider-${provider}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <img src={items[0].image} alt="" className="h-8 w-8 rounded-md object-cover" />
                    <h2 className="font-heading text-lg font-bold">{provider}</h2>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((p) => (
                      <Link
                        key={p.id}
                        to={`/digital/${p.id}`}
                        data-testid={`digital-item-${p.id}`}
                        className="fade-up group flex items-center justify-between rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-md"
                      >
                        <div>
                          <div className="text-sm font-semibold">{p.denom_label}</div>
                          <div className="text-[11px] text-muted-foreground">{p.provider}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-heading font-bold text-primary">{formatCurrency(p.price, currency, lang)}</div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
              {Object.keys(groupedByProvider).length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                  Tidak ada produk yang cocok.
                </p>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
