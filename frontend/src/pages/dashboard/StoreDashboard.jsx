import { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { Package, Wrench, ShoppingBag, Calendar, TrendingUp, Plus } from "lucide-react";

const emptyProd = { name: "", description: "", price: 0, discount: 0, stock: 10, sku: "", category_slug: "electronics", images: [""] };
const emptySvc = { name: "", description: "", starting_price: 0, duration_min: 60, service_area: "Jakarta", category_slug: "electronics-repair", technician: "", images: [""] };

export default function StoreDashboard() {
  const { currency, lang } = useApp();
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categoriesP, setCategoriesP] = useState([]);
  const [categoriesS, setCategoriesS] = useState([]);
  const [pForm, setPForm] = useState(emptyProd);
  const [sForm, setSForm] = useState(emptySvc);
  const [storeForm, setStoreForm] = useState({ name: "", description: "", logo: "", banner: "", address: "", contact: "", whatsapp: "" });

  const load = () => {
    api.get("/dashboard/store").then((r) => setData(r.data));
    api.get("/store/products").then((r) => setProducts(r.data)).catch(() => {});
    api.get("/store/services").then((r) => setServices(r.data)).catch(() => {});
    api.get("/store/orders").then((r) => setOrders(r.data)).catch(() => {});
    api.get("/store/bookings").then((r) => setBookings(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
    api.get("/categories?type=product").then((r) => setCategoriesP(r.data));
    api.get("/categories?type=service").then((r) => setCategoriesS(r.data));
  }, []);

  if (!data) return <div className="p-8">Loading...</div>;

  if (!data.has_store) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6" data-testid="store-onboard">
        <h1 className="mb-3 font-heading text-3xl font-bold">Create your store</h1>
        <p className="mb-6 text-sm text-muted-foreground">Set up your storefront to start selling products and offering services.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api.post("/stores", storeForm);
              toast.success("Store created!");
              load();
            } catch (err) {
              toast.error(formatApiErrorDetail(err.response?.data?.detail));
            }
          }}
          className="space-y-3 rounded-2xl border border-border p-6"
        >
          {["name", "description", "logo", "banner", "address", "contact", "whatsapp"].map((k) => (
            <div key={k}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</label>
              <input required={["name", "description", "address", "contact", "whatsapp"].includes(k)} data-testid={`store-${k}`} value={storeForm[k]} onChange={(e) => setStoreForm({ ...storeForm, [k]: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
          ))}
          <button data-testid="create-store-btn" className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground">Create store</button>
        </form>
      </div>
    );
  }

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post("/products", { ...pForm, price: Number(pForm.price), discount: Number(pForm.discount), stock: Number(pForm.stock) });
      toast.success("Product added");
      setPForm(emptyProd);
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  };

  const addService = async (e) => {
    e.preventDefault();
    try {
      await api.post("/services", { ...sForm, starting_price: Number(sForm.starting_price), duration_min: Number(sForm.duration_min) });
      toast.success("Service added");
      setSForm(emptySvc);
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  };

  const updateOrderStatus = async (id, next) => {
    try {
      await api.patch(`/orders/${id}/status?status=${next}`);
      toast.success("Order updated");
      load();
    } catch (e) {
      toast.error("Failed");
    }
  };

  const updateBookingStatus = async (id, next) => {
    try {
      await api.patch(`/bookings/${id}/status?status=${next}`);
      toast.success("Booking updated");
      load();
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" data-testid="store-dashboard">
      <div className="mb-6 flex items-center gap-3">
        <img src={data.store.logo} alt="" className="h-12 w-12 rounded-xl object-cover" />
        <div>
          <h1 className="font-heading text-2xl font-bold">{data.store.name}</h1>
          <p className="text-xs text-muted-foreground">Store Owner Dashboard</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat icon={<Package className="h-4 w-4" />} label="Products" value={data.products} />
        <Stat icon={<Wrench className="h-4 w-4" />} label="Services" value={data.services} />
        <Stat icon={<ShoppingBag className="h-4 w-4" />} label="Orders" value={data.orders} />
        <Stat icon={<Calendar className="h-4 w-4" />} label="Bookings" value={data.bookings} />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="Revenue" value={formatCurrency(data.revenue, currency, lang)} />
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-heading font-bold">Monthly revenue</h3>
        <div className="h-64" data-testid="store-revenue-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.monthly_revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList data-testid="store-tabs">
          <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
          <TabsTrigger value="services" data-testid="tab-services">Services</TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
          <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4 space-y-4">
          <form onSubmit={addProduct} data-testid="product-form" className="grid gap-2 rounded-xl border border-border p-4 md:grid-cols-6">
            <input required placeholder="Name" data-testid="p-name" value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input required placeholder="SKU" data-testid="p-sku" value={pForm.sku} onChange={(e) => setPForm({ ...pForm, sku: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input required type="number" placeholder="Price" data-testid="p-price" value={pForm.price} onChange={(e) => setPForm({ ...pForm, price: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input type="number" placeholder="Stock" data-testid="p-stock" value={pForm.stock} onChange={(e) => setPForm({ ...pForm, stock: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <select value={pForm.category_slug} data-testid="p-cat" onChange={(e) => setPForm({ ...pForm, category_slug: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
              {categoriesP.map((c) => <option key={c.slug} value={c.slug}>{c.name_en}</option>)}
            </select>
            <input placeholder="Image URL" data-testid="p-image" value={pForm.images[0]} onChange={(e) => setPForm({ ...pForm, images: [e.target.value] })} className="col-span-4 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input placeholder="Description" data-testid="p-desc" value={pForm.description} onChange={(e) => setPForm({ ...pForm, description: e.target.value })} className="col-span-6 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button data-testid="add-product-btn" className="col-span-6 flex items-center justify-center gap-1 rounded-full bg-primary py-2 text-xs font-bold text-primary-foreground"><Plus className="h-3 w-3" /> Add product</button>
          </form>
          <div className="rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr><th className="p-2 text-left">Product</th><th className="p-2 text-left">Category</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">Stock</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-2">{p.name}</td>
                    <td className="p-2 text-muted-foreground">{p.category_slug}</td>
                    <td className="p-2 text-right font-semibold">{formatCurrency(p.price, currency, lang)}</td>
                    <td className="p-2 text-right">{p.stock}</td>
                  </tr>
                ))}
                {products.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No products yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-4 space-y-4">
          <form onSubmit={addService} data-testid="service-form" className="grid gap-2 rounded-xl border border-border p-4 md:grid-cols-6">
            <input required placeholder="Name" data-testid="s-name" value={sForm.name} onChange={(e) => setSForm({ ...sForm, name: e.target.value })} className="col-span-3 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input required type="number" placeholder="Starting price" data-testid="s-price" value={sForm.starting_price} onChange={(e) => setSForm({ ...sForm, starting_price: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input type="number" placeholder="Minutes" data-testid="s-dur" value={sForm.duration_min} onChange={(e) => setSForm({ ...sForm, duration_min: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <select value={sForm.category_slug} data-testid="s-cat" onChange={(e) => setSForm({ ...sForm, category_slug: e.target.value })} className="rounded-lg border border-border bg-background px-2 py-2 text-sm">
              {categoriesS.map((c) => <option key={c.slug} value={c.slug}>{c.name_en}</option>)}
            </select>
            <input placeholder="Area" data-testid="s-area" value={sForm.service_area} onChange={(e) => setSForm({ ...sForm, service_area: e.target.value })} className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input placeholder="Technician" data-testid="s-tech" value={sForm.technician} onChange={(e) => setSForm({ ...sForm, technician: e.target.value })} className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input placeholder="Image URL" data-testid="s-image" value={sForm.images[0]} onChange={(e) => setSForm({ ...sForm, images: [e.target.value] })} className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input placeholder="Description" data-testid="s-desc" value={sForm.description} onChange={(e) => setSForm({ ...sForm, description: e.target.value })} className="col-span-6 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button data-testid="add-service-btn" className="col-span-6 rounded-full bg-primary py-2 text-xs font-bold text-primary-foreground">Add service</button>
          </form>
          <ul className="rounded-xl border border-border divide-y divide-border">
            {services.map((s) => (
              <li key={s.id} className="flex justify-between p-3 text-sm">
                <span>{s.name}</span>
                <span className="font-semibold">{formatCurrency(s.starting_price, currency, lang)}</span>
              </li>
            ))}
            {services.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No services yet.</li>}
          </ul>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          {orders.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No orders yet.</p> : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <div className="text-sm font-bold">#{o.id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-sm font-semibold">{formatCurrency(o.total, currency, lang)}</div>
                  <select data-testid={`order-status-${o.id}`} value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1 text-xs">
                    {["pending", "paid", "processing", "shipped", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          {bookings.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No bookings yet.</p> : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <div className="text-sm font-bold">{b.service_name}</div>
                    <div className="text-xs text-muted-foreground">{b.date} at {b.time}</div>
                  </div>
                  <select data-testid={`booking-status-${b.id}`} value={b.status} onChange={(e) => updateBookingStatus(b.id, e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1 text-xs">
                    {["pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
      <div className="mt-1.5 font-heading text-xl font-extrabold">{value}</div>
    </div>
  );
}
