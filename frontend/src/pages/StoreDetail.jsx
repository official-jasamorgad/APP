import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import ServiceCard from "@/components/ServiceCard";
import { Star, MapPin, Phone, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StoreDetail() {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.get(`/stores/${id}`).then((r) => setStore(r.data));
    api.get(`/products?store_id=${id}`).then((r) => setProducts(r.data));
    api.get(`/services?store_id=${id}`).then((r) => setServices(r.data));
  }, [id]);

  if (!store) return <div className="p-8">Loading...</div>;

  return (
    <div data-testid="store-detail-page">
      <div className="relative h-64 overflow-hidden md:h-80">
        <img src={store.banner} alt={store.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="-mt-16 mb-6 flex flex-col items-start gap-4 rounded-3xl border border-border bg-card p-6 shadow-lg md:flex-row md:items-center">
          <img src={store.logo} alt="" className="h-20 w-20 rounded-2xl object-cover" />
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">{store.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{store.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />{store.rating?.toFixed(1)} ({store.review_count})</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{store.address}</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{store.contact}</span>
            </div>
          </div>
          <a
            href={`https://wa.me/${store.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            data-testid="store-whatsapp-btn"
            className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>

        <Tabs defaultValue="products" className="mb-12">
          <TabsList data-testid="store-tabs">
            <TabsTrigger value="products" data-testid="tab-products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-services">Services ({services.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="mt-6">
            {products.length ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">No products yet.</p>
            )}
          </TabsContent>
          <TabsContent value="services" className="mt-6">
            {services.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services.map((s, i) => <ServiceCard key={s.id} service={s} index={i} />)}
              </div>
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">No services yet.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
